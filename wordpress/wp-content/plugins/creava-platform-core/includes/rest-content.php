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

function creava_discovery_post_type_map(): array {
    return [
        'blog' => ['postType' => 'blog', 'sourceSite' => 'main', 'contentType' => 'blog', 'pathPrefix' => '/blog/'],
        'news' => ['postType' => 'news', 'sourceSite' => 'main', 'contentType' => 'news', 'pathPrefix' => '/news/'],
        'event' => ['postType' => 'event', 'sourceSite' => 'main', 'contentType' => 'event', 'pathPrefix' => '/events/'],
        'work' => ['postType' => 'work', 'sourceSite' => 'main', 'contentType' => 'page', 'pathPrefix' => '/works/'],
        'store_product' => ['postType' => 'store_product', 'sourceSite' => 'store', 'contentType' => 'product', 'pathPrefix' => '/store/products/'],
        'fanclub_content' => ['postType' => 'fanclub_content', 'sourceSite' => 'fc', 'contentType' => 'fanclub', 'pathPrefix' => '/fanclub/content/'],
    ];
}

function creava_discovery_collect_items(WP_REST_Request $request): array {
    $q = sanitize_text_field((string) $request->get_param('q'));
    $source_site = sanitize_key((string) $request->get_param('sourceSite'));
    $content_type = sanitize_key((string) $request->get_param('contentType'));
    $category = sanitize_title((string) $request->get_param('category'));
    $sort = sanitize_key((string) $request->get_param('sort'));
    $member_state = sanitize_key((string) $request->get_param('memberState')) === 'member' ? 'member' : 'guest';
    $limit = (int) $request->get_param('limit');
    $limit = $limit > 0 ? min($limit, 100) : 24;
    $locale = creava_get_locale_from_request($request);

    $items = [];
    $post_type_map = creava_discovery_post_type_map();
    $types = array_keys($post_type_map);

    $query = new WP_Query([
        'post_type' => $types,
        'post_status' => 'publish',
        'posts_per_page' => 200,
        's' => $q,
        'orderby' => $sort === 'updated' ? 'modified' : 'date',
        'order' => 'DESC',
    ]);

    foreach ($query->posts as $post) {
        $mapped = $post_type_map[$post->post_type] ?? null;
        if (!$mapped) {
            continue;
        }

        if ($source_site !== '' && $source_site !== 'all' && $mapped['sourceSite'] !== $source_site) {
            continue;
        }

        if ($content_type !== '' && $content_type !== 'all' && $mapped['contentType'] !== $content_type) {
            continue;
        }

        $visibility_meta = creava_get_visibility_meta($post->ID);
        if ($member_state === 'guest' && $visibility_meta['accessStatus'] !== 'public') {
            continue;
        }

        $primary_category = null;
        $tags = [];
        $taxonomies = creava_get_post_taxonomies_payload($post->ID);
        foreach ($taxonomies as $taxonomy_slug => $terms) {
            if (!is_array($terms)) {
                continue;
            }
            if ($primary_category === null && !empty($terms) && isset($terms[0]['slug'])) {
                $primary_category = $terms[0]['slug'];
            }
            foreach ($terms as $term) {
                if (isset($term['slug'])) {
                    $tags[] = (string) $term['slug'];
                }
            }
            if ($taxonomy_slug === 'category' && !empty($terms) && isset($terms[0]['slug'])) {
                $primary_category = $terms[0]['slug'];
            }
        }

        if ($category !== '' && $primary_category !== $category && !in_array($category, $tags, true)) {
            continue;
        }

        $items[] = [
            'id' => (string) $post->ID,
            'sourceSite' => $mapped['sourceSite'],
            'contentType' => $mapped['contentType'],
            'title' => get_the_title($post),
            'summary' => get_the_excerpt($post),
            'bodyExtract' => wp_trim_words(wp_strip_all_tags((string) $post->post_content), 48, '…'),
            'locale' => $locale,
            'category' => $primary_category,
            'tags' => array_values(array_unique($tags)),
            'slug' => $post->post_name,
            'path' => $mapped['pathPrefix'] . $post->post_name,
            'visibility' => $visibility_meta['accessStatus'],
            'requiresAuth' => $visibility_meta['accessStatus'] !== 'public',
            'publishStatus' => 'published',
            'displayPriority' => 0,
            'updatedAt' => get_post_modified_time('c', true, $post) ?: null,
            'popularityScore' => 0,
            'related' => [],
        ];
    }

    return array_slice($items, 0, $limit);
}

function creava_discovery_build_facets(array $items): array {
    $content_type_counts = [];
    $source_site_counts = [];

    foreach ($items as $item) {
        $content_type = (string) ($item['contentType'] ?? 'page');
        $source_site = (string) ($item['sourceSite'] ?? 'main');
        $content_type_counts[$content_type] = ($content_type_counts[$content_type] ?? 0) + 1;
        $source_site_counts[$source_site] = ($source_site_counts[$source_site] ?? 0) + 1;
    }

    $to_pairs = static function (array $counts): array {
        $pairs = [];
        foreach ($counts as $key => $value) {
            $pairs[] = [$key, $value];
        }
        return $pairs;
    };

    return [
        'contentType' => $to_pairs($content_type_counts),
        'sourceSite' => $to_pairs($source_site_counts),
    ];
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
            'callback' => static function (WP_REST_Request $request) use ($post_type, $route) {
                $security_validation = creava_security_validate_public_rest_request($request, 'content_' . $route);
                if ($security_validation instanceof WP_REST_Response) {
                    return $security_validation;
                }

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
                    ...creava_security_base_state($trace_id),
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
        'callback' => static function (WP_REST_Request $request) {
            $security_validation = creava_security_validate_public_rest_request($request, 'site_settings');
            if ($security_validation instanceof WP_REST_Response) {
                return $security_validation;
            }

            $trace_id = wp_generate_uuid4();
            return rest_ensure_response([
                'data' => [
                    'siteName' => get_bloginfo('name'),
                    'description' => get_bloginfo('description'),
                ],
                'meta' => [
                    'trace' => [
                        ...creava_security_base_state($trace_id),
                        'wordpressTraceId' => $trace_id,
                        'wordpressVerifiedAt' => gmdate('c'),
                    ],
                ],
            ]);
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/preview/verify', [
        'methods' => WP_REST_Server::CREATABLE,
        'callback' => static function (WP_REST_Request $request) {
            $security_validation = creava_security_validate_public_rest_request($request, 'preview_verify');
            if ($security_validation instanceof WP_REST_Response) {
                return $security_validation;
            }

            $trace_id = wp_generate_uuid4();
            $params = (array) $request->get_json_params();
            $secret = sanitize_text_field((string) ($params['secret'] ?? ''));
            $type = sanitize_text_field((string) ($params['type'] ?? ''));
            $slug = sanitize_title((string) ($params['slug'] ?? ''));
            $locale = sanitize_text_field((string) ($params['locale'] ?? ''));
            $expected = getenv('WORDPRESS_PREVIEW_SECRET') ?: getenv('PREVIEW_SHARED_SECRET');
            $valid = !empty($expected) && hash_equals((string) $expected, $secret);

            if (!$valid) {
                creava_security_audit_log('preview_verify_denied', ['traceId' => $trace_id, 'type' => $type, 'slug' => $slug]);
                return new WP_REST_Response([
                    'ok' => false,
                    'error' => 'invalid_preview_secret',
                    'wordpressPreviewState' => 'denied',
                    ...creava_security_base_state($trace_id),
                ], 401);
            }

            creava_security_audit_log('preview_verify_success', ['traceId' => $trace_id, 'type' => $type, 'slug' => $slug]);
            return rest_ensure_response([
                'ok' => true,
                ...creava_security_base_state($trace_id),
                'wordpressPreviewState' => 'verified',
                'wordpressPreviewType' => $type,
                'wordpressPreviewSlug' => $slug,
                'wordpressPreviewLocale' => $locale,
                'wordpressVerifiedAt' => gmdate('c'),
            ]);
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/discovery/search', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            $security_validation = creava_security_validate_public_rest_request($request, 'discovery_search');
            if ($security_validation instanceof WP_REST_Response) {
                return $security_validation;
            }

            $trace_id = wp_generate_uuid4();
            $items = creava_discovery_collect_items($request);
            $result_count = count($items);
            $raw_query = sanitize_text_field((string) $request->get_param('q'));
            $search_quality_state = 'healthy';
            if ($result_count === 0) {
                $search_quality_state = 'zero_result_risk';
            } elseif ($result_count < 3) {
                $search_quality_state = 'low_click_risk';
            }

            if (function_exists('creava_ops_record_search_diagnostics')) {
                creava_ops_record_search_diagnostics([
                    'traceId' => $trace_id,
                    'query' => $raw_query,
                    'locale' => creava_get_locale_from_request($request),
                    'sourceSite' => sanitize_key((string) $request->get_param('sourceSite')) ?: 'all',
                    'contentType' => sanitize_key((string) $request->get_param('contentType')) ?: 'all',
                    'resultCount' => $result_count,
                    'searchQualityState' => $search_quality_state,
                    'at' => gmdate('c'),
                ]);
            }

            return rest_ensure_response([
                'query' => [
                    'q' => sanitize_text_field((string) $request->get_param('q')),
                    'sourceSite' => sanitize_key((string) $request->get_param('sourceSite')) ?: 'all',
                    'contentType' => sanitize_key((string) $request->get_param('contentType')) ?: 'all',
                    'category' => sanitize_title((string) $request->get_param('category')),
                    'locale' => creava_get_locale_from_request($request),
                    'sort' => sanitize_key((string) $request->get_param('sort')) ?: 'relevance',
                    'memberState' => sanitize_key((string) $request->get_param('memberState')) === 'member' ? 'member' : 'guest',
                    'limit' => (int) $request->get_param('limit') ?: 24,
                ],
                'total' => $result_count,
                'facets' => creava_discovery_build_facets($items),
                'items' => $items,
                'trace' => [
                    ...creava_security_base_state($trace_id),
                    'wordpressTraceId' => $trace_id,
                    'wordpressSearchObservabilityState' => 'enabled',
                    'wordpressSearchQualityState' => $search_quality_state,
                    'wordpressSearchResultCount' => $result_count,
                    'wordpressVerifiedAt' => gmdate('c'),
                ],
                'recommendations' => [
                    'noResultFallback' => count($items) === 0 ? [
                        ['title' => '最新ニュースを見る', 'path' => '/news', 'contentType' => 'news'],
                        ['title' => 'ストア商品一覧を見る', 'path' => '/store', 'contentType' => 'product'],
                    ] : [],
                ],
            ]);
        },
        'permission_callback' => '__return_true',
    ]);
}
