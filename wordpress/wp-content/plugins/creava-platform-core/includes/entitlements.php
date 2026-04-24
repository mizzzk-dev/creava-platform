<?php
if (!defined('ABSPATH')) { exit; }

function creava_save_entitlement(array $payload): int {
    $customer_id = sanitize_text_field((string) ($payload['stripe_customer_id'] ?? 'unknown'));
    $payload['stripe_customer_id'] = $customer_id;

    return creava_upsert_record('creava_entitlement', 'stripe_customer_id', $customer_id, $payload);
}

function creava_get_customer_entitlement(?int $user_id = null): ?array {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }

    if (!$user_id) {
        return null;
    }

    $stripe_customer_id = get_user_meta($user_id, 'stripe_customer_id', true);
    if (!$stripe_customer_id) {
        return null;
    }

    $query = new WP_Query([
        'post_type' => 'creava_entitlement',
        'post_status' => 'publish',
        'posts_per_page' => 1,
        'meta_key' => 'stripe_customer_id',
        'meta_value' => $stripe_customer_id,
    ]);

    if (empty($query->posts)) {
        return null;
    }

    $post_id = $query->posts[0]->ID;
    return [
        'membership_status' => get_post_meta($post_id, 'membership_status', true) ?: 'inactive',
        'grants' => get_post_meta($post_id, 'grants', true) ?: '',
    ];
}
