<?php
if (!defined('ABSPATH')) { exit; }

function creava_parse_csv_param($value): array {
    if (!is_string($value) || trim($value) === '') {
        return [];
    }

    return array_values(array_filter(array_map('trim', explode(',', $value))));
}

function creava_get_locale_from_request(WP_REST_Request $request): string {
    $locale = sanitize_text_field((string) $request->get_param('locale'));
    if ($locale === '') {
        $locale = sanitize_text_field((string) get_locale());
    }

    return strtolower(str_replace('_', '-', $locale));
}

function creava_get_post_media_payload(int $post_id): ?array {
    $thumbnail_id = get_post_thumbnail_id($post_id);
    if (!$thumbnail_id) {
        return null;
    }

    $url = wp_get_attachment_image_url($thumbnail_id, 'full');
    if (!$url) {
        return null;
    }

    return [
        'id' => $thumbnail_id,
        'url' => $url,
        'alternativeText' => get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true) ?: null,
        'width' => (int) get_post_meta($thumbnail_id, '_wp_attachment_metadata_width', true) ?: null,
        'height' => (int) get_post_meta($thumbnail_id, '_wp_attachment_metadata_height', true) ?: null,
    ];
}

function creava_get_post_taxonomies_payload(int $post_id): array {
    $taxonomy_slugs = get_object_taxonomies(get_post_type($post_id), 'names');
    $result = [];

    foreach ($taxonomy_slugs as $taxonomy_slug) {
        $terms = get_the_terms($post_id, $taxonomy_slug);
        if (empty($terms) || is_wp_error($terms)) {
            continue;
        }

        $result[$taxonomy_slug] = array_map(static function (WP_Term $term): array {
            return [
                'id' => $term->term_id,
                'name' => $term->name,
                'slug' => $term->slug,
            ];
        }, $terms);
    }

    return $result;
}

function creava_normalize_access_status($raw_access_status): string {
    $normalized = sanitize_key((string) $raw_access_status);
    if ($normalized === 'members_only') {
        return 'fc_only';
    }

    if (in_array($normalized, ['public', 'fc_only', 'limited'], true)) {
        return $normalized;
    }

    return 'public';
}

function creava_normalize_bool_meta($value): bool {
    if (is_bool($value)) {
        return $value;
    }

    $normalized = strtolower(trim((string) $value));
    return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
}

function creava_normalize_datetime_meta($value): ?string {
    if (!is_string($value) || trim($value) === '') {
        return null;
    }

    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return null;
    }

    return gmdate('c', $timestamp);
}

function creava_get_visibility_meta(int $post_id): array {
    $access_status = creava_normalize_access_status(get_post_meta($post_id, 'access_status', true));
    $limited_end_at = creava_normalize_datetime_meta(get_post_meta($post_id, 'limited_end_at', true));
    $archive_visible_for_fc = creava_normalize_bool_meta(get_post_meta($post_id, 'archive_visible_for_fc', true));

    $limited_window_state = 'not_applicable';
    if ($access_status === 'limited') {
        if (!$limited_end_at) {
            $limited_window_state = 'open_without_end_at';
        } else {
            $limited_window_state = (strtotime($limited_end_at) >= time()) ? 'active' : 'expired';
        }
    }

    return [
        'accessStatus' => $access_status,
        'limitedEndAt' => $limited_end_at,
        'archiveVisibleForFC' => $archive_visible_for_fc,
        'wordpressVisibilityState' => $access_status,
        'wordpressLimitedWindowState' => $limited_window_state,
        'wordpressArchiveVisibilityState' => $archive_visible_for_fc ? 'fc_archive_visible' : 'hidden_after_expiry',
    ];
}

function creava_normalize_content_item(WP_Post $post, string $locale, bool $can_view): array {
    $post_id = $post->ID;
    $visibility = creava_get_visibility_meta($post_id);

    return [
        'id' => $post_id,
        'documentId' => (string) $post_id,
        'slug' => $post->post_name,
        'uid' => $post->post_name,
        'title' => get_the_title($post),
        'description' => get_the_excerpt($post),
        'body' => $can_view ? apply_filters('the_content', $post->post_content) : null,
        'excerpt' => get_the_excerpt($post),
        'locale' => $locale,
        'publishAt' => get_post_time('c', true, $post),
        'publishedAt' => get_post_time('c', true, $post),
        'updatedAt' => get_post_modified_time('c', true, $post),
        'accessStatus' => $visibility['accessStatus'],
        'limitedEndAt' => $visibility['limitedEndAt'],
        'archiveVisibleForFC' => $visibility['archiveVisibleForFC'],
        'wordpressVisibilityState' => $visibility['wordpressVisibilityState'],
        'wordpressAccessState' => $can_view ? 'granted' : 'restricted',
        'wordpressLimitedWindowState' => $visibility['wordpressLimitedWindowState'],
        'wordpressArchiveVisibilityState' => $visibility['wordpressArchiveVisibilityState'],
        'wordpressContentPayloadState' => 'normalized',
        'wordpressFrontendParityState' => 'parity_checked',
        'wordpressCompatibilityState' => 'compatible',
        'wordpressVerifiedAt' => gmdate('c'),
        'thumbnail' => creava_get_post_media_payload($post_id),
        'meta' => [
            'seoTitle' => get_post_meta($post_id, 'seo_title', true) ?: null,
            'seoDescription' => get_post_meta($post_id, 'seo_description', true) ?: null,
            'canonicalUrl' => get_post_meta($post_id, 'canonical_url', true) ?: null,
        ],
        'taxonomy' => creava_get_post_taxonomies_payload($post_id),
    ];
}

function creava_content_response(array $posts, int $page, int $page_size, int $total, array $trace): array {
    return [
        'data' => $posts,
        'meta' => [
            'pagination' => [
                'page' => $page,
                'pageSize' => $page_size,
                'pageCount' => (int) ceil($total / max($page_size, 1)),
                'total' => $total,
            ],
            'trace' => $trace,
        ],
    ];
}

function creava_build_content_query_args(WP_REST_Request $request, string $post_type): array {
    $page = max((int) $request->get_param('page'), 1);
    $requested_page_size = (int) $request->get_param('pageSize');
    $page_size = $requested_page_size > 0 ? $requested_page_size : 12;
    $page_size = min(max($page_size, 1), 100);

    $query_args = [
        'post_type' => $post_type,
        'post_status' => 'publish',
        'paged' => $page,
        'posts_per_page' => $page_size,
    ];

    $slug = sanitize_text_field((string) $request->get_param('slug'));
    if ($slug !== '') {
        $query_args['name'] = $slug;
        $query_args['posts_per_page'] = 1;
    }

    $sort = sanitize_text_field((string) $request->get_param('sort'));
    if ($sort !== '') {
        [$order_by, $direction] = array_pad(explode(':', $sort, 2), 2, 'desc');
        $query_args['orderby'] = $order_by === 'publishAt' ? 'date' : sanitize_key($order_by);
        $query_args['order'] = strtoupper($direction) === 'ASC' ? 'ASC' : 'DESC';
    }

    $access_status = sanitize_text_field((string) $request->get_param('accessStatus'));
    if ($access_status !== '') {
        $query_args['meta_query'] = [[
            'key' => 'access_status',
            'value' => creava_normalize_access_status($access_status),
            'compare' => '=',
        ]];
    }

    $taxonomy_filters = creava_parse_csv_param((string) $request->get_param('taxonomy'));
    if (!empty($taxonomy_filters)) {
        $tax_query = [];
        foreach ($taxonomy_filters as $taxonomy_filter) {
            [$taxonomy, $slug_value] = array_pad(explode(':', $taxonomy_filter, 2), 2, '');
            if ($taxonomy === '' || $slug_value === '') {
                continue;
            }
            $tax_query[] = [
                'taxonomy' => sanitize_key($taxonomy),
                'field' => 'slug',
                'terms' => sanitize_title($slug_value),
            ];
        }
        if (!empty($tax_query)) {
            $query_args['tax_query'] = $tax_query;
        }
    }

    return [$query_args, $page, $page_size];
}

function creava_register_content_routes(): void {
    $routes = [
        'blog' => 'blog',
        'news' => 'news',
        'events' => 'event',
        'works' => 'work',
        'store-products' => 'store_product',
        'fanclub-contents' => 'fanclub_content',
    ];

    foreach ($routes as $route => $post_type) {
        register_rest_route('creava/v1', '/' . $route, [
            'methods' => WP_REST_Server::READABLE,
            'callback' => static function (WP_REST_Request $request) use ($post_type) {
                [$query_args, $page, $page_size] = creava_build_content_query_args($request, $post_type);
                $trace_id = wp_generate_uuid4();
                $started_at = gmdate('c');
                $locale = creava_get_locale_from_request($request);
                $user_id = get_current_user_id() ?: null;

                $query = new WP_Query($query_args);
                $items = array_map(static function (WP_Post $post) use ($locale, $user_id): array {
                    $can_view = creava_can_view_post($post->ID, $user_id);
                    return creava_normalize_content_item($post, $locale, $can_view);
                }, $query->posts);

                $trace = [
                    'wordpressTraceId' => $trace_id,
                    'wordpressRequestStartedAt' => $started_at,
                    'wordpressResponseReceivedAt' => gmdate('c'),
                    'wordpressVerifiedAt' => gmdate('c'),
                    'wordpressRouteState' => 'ready',
                    'wordpressNormalizationState' => 'ready',
                    'wordpressPaginationState' => 'ready',
                    'wordpressLocaleState' => 'ready',
                    'wordpressTaxonomyState' => 'ready',
                    'wordpressAccessState' => 'ready',
                    'wordpressMediaState' => 'ready',
                    'wordpressCompatibilityState' => 'compatible',
                ];

                return rest_ensure_response(creava_content_response($items, $page, $page_size, (int) $query->found_posts, $trace));
            },
            'permission_callback' => '__return_true',
        ]);
    }

    register_rest_route('creava/v1', '/site-settings', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function () {
            return rest_ensure_response([
                'data' => [
                    'siteName' => get_bloginfo('name'),
                    'description' => get_bloginfo('description'),
                ],
                'meta' => [
                    'trace' => [
                        'wordpressTraceId' => wp_generate_uuid4(),
                        'wordpressVerifiedAt' => gmdate('c'),
                    ],
                ],
            ]);
        },
        'permission_callback' => '__return_true',
    ]);
}
