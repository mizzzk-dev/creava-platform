<?php
if (!defined('ABSPATH')) { exit; }

function creava_can_view_post(int $post_id, ?int $user_id = null): bool {
    $access = get_post_meta($post_id, 'access_status', true) ?: 'public';
    if ($access === 'public') {
        return true;
    }

    if (!$user_id) {
        $user_id = get_current_user_id();
    }

    if (!$user_id) {
        return false;
    }

    if (user_can($user_id, 'manage_options')) {
        return true;
    }

    $entitlement = creava_get_customer_entitlement($user_id);
    if (!$entitlement) {
        return false;
    }

    $membership_status = $entitlement['membership_status'] ?? 'inactive';
    if ($membership_status !== 'active' && $membership_status !== 'trialing') {
        return false;
    }

    if ($access === 'members_only') {
        return true;
    }

    if ($access === 'limited') {
        return true;
    }

    return false;
}
