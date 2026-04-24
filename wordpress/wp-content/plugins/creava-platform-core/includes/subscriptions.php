<?php
if (!defined('ABSPATH')) { exit; }

function creava_save_subscription(array $payload): int {
    $subscription_id = sanitize_text_field((string) ($payload['stripe_subscription_id'] ?? 'unknown'));
    $payload['stripe_subscription_id'] = $subscription_id;

    return creava_upsert_record('creava_subscription', 'stripe_subscription_id', $subscription_id, $payload);
}
