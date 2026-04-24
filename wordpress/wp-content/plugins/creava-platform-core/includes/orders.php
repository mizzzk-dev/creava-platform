<?php
if (!defined('ABSPATH')) { exit; }

function creava_upsert_record(string $post_type, string $external_id_key, string $external_id_value, array $payload): int {
    $query = new WP_Query([
        'post_type' => $post_type,
        'post_status' => 'any',
        'posts_per_page' => 1,
        'meta_key' => $external_id_key,
        'meta_value' => $external_id_value,
        'fields' => 'ids',
        'no_found_rows' => true,
    ]);

    $post_id = !empty($query->posts) ? (int) $query->posts[0] : 0;

    $post_args = [
        'post_type' => $post_type,
        'post_status' => 'publish',
        'meta_input' => $payload,
    ];

    if ($post_id > 0) {
        $post_args['ID'] = $post_id;
        wp_update_post($post_args);
        return $post_id;
    }

    return wp_insert_post($post_args);
}

function creava_save_order(array $payload): int {
    $session_id = sanitize_text_field((string) ($payload['stripe_session_id'] ?? 'unknown'));
    $payload['stripe_session_id'] = $session_id;

    return creava_upsert_record('creava_order', 'stripe_session_id', $session_id, $payload);
}
