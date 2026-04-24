<?php
if (!defined('ABSPATH')) { exit; }

function creava_get_stripe_secret_key(): string {
    return (string) (getenv('STRIPE_SECRET_KEY') ?: '');
}

function creava_get_stripe_base_url(): string {
    return (string) (getenv('STRIPE_API_BASE') ?: 'https://api.stripe.com/v1');
}

function creava_register_stripe_routes(): void {
    register_rest_route('creava/v1', '/checkout/session', [
        'methods' => WP_REST_Server::CREATABLE,
        'callback' => 'creava_create_checkout_session',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/billing/portal', [
        'methods' => WP_REST_Server::CREATABLE,
        'callback' => 'creava_create_billing_portal_session',
        'permission_callback' => static function () { return is_user_logged_in(); },
    ]);
}

function creava_stripe_post(string $path, array $payload): array {
    $secret_key = creava_get_stripe_secret_key();
    if ($secret_key === '') {
        return ['error' => 'missing_stripe_secret'];
    }

    $response = wp_remote_post(creava_get_stripe_base_url() . $path, [
        'headers' => [
            'Authorization' => 'Bearer ' . $secret_key,
            'Content-Type' => 'application/x-www-form-urlencoded',
        ],
        'body' => http_build_query($payload),
        'timeout' => 20,
    ]);

    if (is_wp_error($response)) {
        return ['error' => 'stripe_network_error', 'message' => $response->get_error_message()];
    }

    $status = (int) wp_remote_retrieve_response_code($response);
    $body = json_decode((string) wp_remote_retrieve_body($response), true);

    if ($status < 200 || $status >= 300) {
        return [
            'error' => 'stripe_api_error',
            'status' => $status,
            'body' => $body,
        ];
    }

    return ['data' => $body];
}

function creava_create_checkout_session(WP_REST_Request $request) {
    $payload = $request->get_json_params();
    $price_id = sanitize_text_field((string) ($payload['priceId'] ?? $payload['planId'] ?? $payload['productId'] ?? ''));
    if ($price_id === '') {
        return new WP_REST_Response(['error' => 'missing_price_or_plan_id'], 400);
    }

    $mode = !empty($payload['membership']) ? 'subscription' : 'payment';
    $result = creava_stripe_post('/checkout/sessions', [
        'mode' => $mode,
        'line_items[0][price]' => $price_id,
        'line_items[0][quantity]' => max(1, (int) ($payload['quantity'] ?? 1)),
        'success_url' => (string) (getenv('STRIPE_SUCCESS_URL') ?: home_url('/checkout/success')),
        'cancel_url' => (string) (getenv('STRIPE_CANCEL_URL') ?: home_url('/checkout/cancel')),
        'client_reference_id' => sanitize_text_field((string) ($payload['userId'] ?? 'guest')),
    ]);

    if (isset($result['error'])) {
        return new WP_REST_Response($result, 502);
    }

    $session = (array) ($result['data'] ?? []);
    creava_save_order([
        'stripe_session_id' => sanitize_text_field((string) ($session['id'] ?? '')),
        'status' => 'created',
        'raw' => wp_json_encode($session),
    ]);

    return rest_ensure_response([
        'url' => $session['url'] ?? null,
        'sessionId' => $session['id'] ?? null,
    ]);
}

function creava_create_billing_portal_session(WP_REST_Request $request) {
    $user_id = get_current_user_id();
    $customer_id = (string) get_user_meta($user_id, 'stripe_customer_id', true);
    if ($customer_id === '') {
        return new WP_REST_Response(['error' => 'customer_not_found'], 404);
    }

    $result = creava_stripe_post('/billing_portal/sessions', [
        'customer' => $customer_id,
        'return_url' => (string) (getenv('STRIPE_PORTAL_RETURN_URL') ?: home_url('/member')),
    ]);

    if (isset($result['error'])) {
        return new WP_REST_Response($result, 502);
    }

    $session = (array) ($result['data'] ?? []);
    return rest_ensure_response(['url' => $session['url'] ?? null]);
}
