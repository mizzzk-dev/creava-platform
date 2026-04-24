<?php
if (!defined('ABSPATH')) { exit; }

function creava_register_migration_routes(): void {
    $routes = [
        'blog' => 'blog',
        'news' => 'news',
        'events' => 'event',
        'works' => 'work',
        'store-products' => 'store_product',
        'fanclub-contents' => 'fanclub_content',
    ];

    foreach ($routes as $route => $post_type) {
        register_rest_route('creava/v1', '/migration/' . $route, [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => static function (WP_REST_Request $request) use ($post_type) {
                $params = (array) $request->get_json_params();
                $slug = sanitize_title((string) ($params['slug'] ?? ''));
                if ($slug === '') {
                    return new WP_REST_Response(['error' => 'missing_slug'], 400);
                }

                $existing = get_page_by_path($slug, OBJECT, $post_type);
                $post_args = [
                    'post_type' => $post_type,
                    'post_status' => 'publish',
                    'post_title' => sanitize_text_field((string) ($params['title'] ?? $slug)),
                    'post_name' => $slug,
                    'post_content' => wp_kses_post((string) ($params['body'] ?? '')),
                    'post_excerpt' => sanitize_textarea_field((string) ($params['excerpt'] ?? '')),
                ];

                if ($existing) {
                    $post_args['ID'] = $existing->ID;
                    $post_id = wp_update_post($post_args, true);
                } else {
                    $post_id = wp_insert_post($post_args, true);
                }

                if (is_wp_error($post_id)) {
                    return new WP_REST_Response(['error' => 'upsert_failed', 'detail' => $post_id->get_error_message()], 500);
                }

                update_post_meta($post_id, 'access_status', sanitize_text_field((string) ($params['accessStatus'] ?? 'public')));
                if (!empty($params['publishAt'])) {
                    update_post_meta($post_id, 'publish_at', sanitize_text_field((string) $params['publishAt']));
                }

                return rest_ensure_response(['id' => $post_id, 'slug' => $slug]);
            },
            'permission_callback' => static function () {
                return current_user_can('edit_posts') || !empty(getenv('WORDPRESS_MIGRATION_APP_TOKEN'));
            },
        ]);
    }
}
