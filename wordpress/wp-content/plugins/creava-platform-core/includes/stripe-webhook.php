<?php
if (!defined('ABSPATH')) { exit; }

function creava_verify_stripe_signature(string $payload, string $signature_header, string $secret): bool {
    if ($signature_header === '' || $secret === '') {
        return false;
    }

    $segments = [];
    foreach (explode(',', $signature_header) as $part) {
        [$k, $v] = array_pad(explode('=', trim($part), 2), 2, '');
        if ($k !== '' && $v !== '') {
            $segments[$k][] = $v;
        }
    }

    $timestamp = $segments['t'][0] ?? '';
    $signature = $segments['v1'][0] ?? '';
    if ($timestamp === '' || $signature === '') {
        return false;
    }

    if (abs(time() - (int) $timestamp) > 300) {
        return false;
    }

    $expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    return hash_equals($expected, $signature);
}

function creava_is_duplicate_event(string $event_id): bool {
    if ($event_id === '') {
        return true;
    }

    $query = new WP_Query([
        'post_type' => 'creava_order',
        'posts_per_page' => 1,
        'post_status' => 'any',
        'meta_key' => 'stripe_event_id',
        'meta_value' => $event_id,
        'fields' => 'ids',
        'no_found_rows' => true,
    ]);

    return !empty($query->posts);
}

function creava_handle_webhook_event(array $event): void {
    $type = (string) ($event['type'] ?? '');
    $data_object = (array) ($event['data']['object'] ?? []);

    if ($type === 'checkout.session.completed') {
        creava_save_order([
            'stripe_event_id' => sanitize_text_field((string) ($event['id'] ?? '')),
            'stripe_session_id' => sanitize_text_field((string) ($data_object['id'] ?? '')),
            'stripe_customer_id' => sanitize_text_field((string) ($data_object['customer'] ?? '')),
            'status' => 'completed',
            'raw' => wp_json_encode($event),
        ]);
        return;
    }

    if ($type === 'customer.subscription.updated' || $type === 'customer.subscription.created') {
        creava_save_subscription([
            'stripe_event_id' => sanitize_text_field((string) ($event['id'] ?? '')),
            'stripe_subscription_id' => sanitize_text_field((string) ($data_object['id'] ?? '')),
            'stripe_customer_id' => sanitize_text_field((string) ($data_object['customer'] ?? '')),
            'membership_status' => sanitize_text_field((string) ($data_object['status'] ?? 'inactive')),
            'raw' => wp_json_encode($event),
        ]);

        creava_save_entitlement([
            'stripe_customer_id' => sanitize_text_field((string) ($data_object['customer'] ?? '')),
            'membership_status' => sanitize_text_field((string) ($data_object['status'] ?? 'inactive')),
            'grants' => ($data_object['status'] ?? '') === 'active' ? 'members_only,limited' : '',
            'updated_at' => gmdate('c'),
        ]);
        return;
    }

    if ($type === 'customer.subscription.deleted') {
        creava_save_subscription([
            'stripe_event_id' => sanitize_text_field((string) ($event['id'] ?? '')),
            'stripe_subscription_id' => sanitize_text_field((string) ($data_object['id'] ?? '')),
            'stripe_customer_id' => sanitize_text_field((string) ($data_object['customer'] ?? '')),
            'membership_status' => 'canceled',
            'raw' => wp_json_encode($event),
        ]);

        creava_save_entitlement([
            'stripe_customer_id' => sanitize_text_field((string) ($data_object['customer'] ?? '')),
            'membership_status' => 'canceled',
            'grants' => '',
            'updated_at' => gmdate('c'),
        ]);
    }
}

function creava_handle_stripe_webhook(WP_REST_Request $request) {
    $signature = (string) $request->get_header('stripe-signature');
    $payload = (string) $request->get_body();
    $secret = (string) (getenv('STRIPE_WEBHOOK_SECRET') ?: '');

    if (!creava_verify_stripe_signature($payload, $signature, $secret)) {
        return new WP_REST_Response(['error' => 'invalid_signature'], 400);
    }

    $event = json_decode($payload, true);
    if (!is_array($event) || empty($event['id']) || empty($event['type'])) {
        return new WP_REST_Response(['error' => 'invalid_payload'], 400);
    }

    $event_id = sanitize_text_field((string) $event['id']);
    if (creava_is_duplicate_event($event_id)) {
        return new WP_REST_Response(['received' => true, 'duplicate' => true], 200);
    }

    creava_handle_webhook_event($event);

    return new WP_REST_Response([
        'received' => true,
        'eventId' => $event_id,
        'type' => sanitize_text_field((string) $event['type']),
    ], 200);
}
