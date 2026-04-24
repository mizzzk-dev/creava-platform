<?php
if (!defined('ABSPATH')) { exit; }

function creava_is_active_member(int $user_id): bool {
    if (user_can($user_id, 'manage_options')) {
        return true;
    }

    $entitlement = creava_get_customer_entitlement($user_id);
    if (!$entitlement) {
        return false;
    }

    $membership_status = $entitlement['membership_status'] ?? 'inactive';
    return $membership_status === 'active' || $membership_status === 'trialing';
}

function creava_can_view_post(int $post_id, ?int $user_id = null): bool {
    $access = creava_normalize_access_status(get_post_meta($post_id, 'access_status', true));

    if ($access === 'public') {
        return true;
    }

    if (!$user_id) {
        $user_id = get_current_user_id();
    }

    $limited_end_at_raw = get_post_meta($post_id, 'limited_end_at', true);
    $limited_end_at = creava_normalize_datetime_meta($limited_end_at_raw);
    $archive_visible_for_fc = creava_normalize_bool_meta(get_post_meta($post_id, 'archive_visible_for_fc', true));

    if ($access === 'limited') {
        if (!$limited_end_at) {
            return true;
        }

        if (strtotime($limited_end_at) >= time()) {
            return true;
        }

        if (!$archive_visible_for_fc || !$user_id) {
            return false;
        }

        return creava_is_active_member($user_id);
    }

    if (!$user_id) {
        return false;
    }

    if ($access === 'fc_only') {
        return creava_is_active_member($user_id);
    }

    return false;
}
