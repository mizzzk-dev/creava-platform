<?php
if (!defined('ABSPATH')) { exit; }

function creava_get_stripe_secret_key(): string {
    return (string) (getenv('STRIPE_SECRET_KEY') ?: '');
}

function creava_get_stripe_base_url(): string {
    return (string) (getenv('STRIPE_API_BASE') ?: 'https://api.stripe.com/v1');
}

function creava_get_headless_jwt_secret(): string {
    return (string) (getenv('WORDPRESS_HEADLESS_JWT_SECRET') ?: '');
}

function creava_decode_base64url(string $value): string {
    $remainder = strlen($value) % 4;
    if ($remainder > 0) {
        $value .= str_repeat('=', 4 - $remainder);
    }
    return (string) base64_decode(strtr($value, '-_', '+/'));
}

function creava_extract_bearer_token(WP_REST_Request $request): string {
    $header = (string) ($request->get_header('authorization') ?: $request->get_header('Authorization'));
    if (!preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        return '';
    }

    return trim((string) ($matches[1] ?? ''));
}

function creava_validate_headless_jwt(string $token): ?array {
    $secret = creava_get_headless_jwt_secret();
    if ($secret === '') {
        return null;
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$encoded_header, $encoded_payload, $encoded_signature] = $parts;
    $expected_signature = rtrim(strtr(base64_encode(hash_hmac('sha256', $encoded_header . '.' . $encoded_payload, $secret, true)), '+/', '-_'), '=');

    if (!hash_equals($expected_signature, $encoded_signature)) {
        return null;
    }

    $payload_json = creava_decode_base64url($encoded_payload);
    $payload = json_decode($payload_json, true);
    if (!is_array($payload)) {
        return null;
    }

    $now = time();
    if (!empty($payload['exp']) && (int) $payload['exp'] < $now) {
        return null;
    }
    if (!empty($payload['nbf']) && (int) $payload['nbf'] > $now) {
        return null;
    }

    return $payload;
}

function creava_resolve_user_from_claims(array $claims): int {
    if (!empty($claims['wpUserId'])) {
        $user_id = absint($claims['wpUserId']);
        return $user_id > 0 ? $user_id : 0;
    }

    if (!empty($claims['sub']) && is_numeric($claims['sub'])) {
        $user_id = absint($claims['sub']);
        return $user_id > 0 ? $user_id : 0;
    }

    if (!empty($claims['email'])) {
        $user = get_user_by('email', sanitize_email((string) $claims['email']));
        if ($user instanceof WP_User) {
            return (int) $user->ID;
        }
    }

    return 0;
}

function creava_get_authenticated_user_id(WP_REST_Request $request): int {
    $current_user_id = get_current_user_id();
    if ($current_user_id > 0) {
        return $current_user_id;
    }

    $token = creava_extract_bearer_token($request);
    if ($token === '') {
        return 0;
    }

    $claims = creava_validate_headless_jwt($token);
    if (!$claims) {
        return 0;
    }

    return creava_resolve_user_from_claims($claims);
}

function creava_register_stripe_routes(): void {
    register_rest_route('creava/v1', '/checkout/session', [
        'methods' => WP_REST_Server::CREATABLE,
        'callback' => 'creava_create_checkout_session',
        'permission_callback' => static function (WP_REST_Request $request) {
            return creava_security_is_allowed_origin($request);
        },
    ]);

    register_rest_route('creava/v1', '/billing/portal', [
        'methods' => WP_REST_Server::CREATABLE,
        'callback' => 'creava_create_billing_portal_session',
        'permission_callback' => static function (WP_REST_Request $request) {
            return creava_get_authenticated_user_id($request) > 0;
        },
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
    $security_validation = creava_security_validate_public_rest_request($request, 'stripe_checkout_session');
    if ($security_validation instanceof WP_REST_Response) {
        return $security_validation;
    }

    $trace_id = wp_generate_uuid4();
    $payload = $request->get_json_params();
    $price_id = sanitize_text_field((string) ($payload['priceId'] ?? $payload['planId'] ?? $payload['productId'] ?? ''));
    if ($price_id === '') {
        creava_security_audit_log('stripe_checkout_invalid_payload', ['traceId' => $trace_id]);
        return new WP_REST_Response([
            'error' => 'missing_price_or_plan_id',
            ...creava_security_base_state($trace_id),
        ], 400);
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
        creava_security_audit_log('stripe_checkout_failed', ['traceId' => $trace_id, 'error' => (string) ($result['error'] ?? 'unknown')]);
        return new WP_REST_Response([
            ...$result,
            ...creava_security_base_state($trace_id),
        ], 502);
    }

    $session = (array) ($result['data'] ?? []);
    creava_save_order([
        'stripe_session_id' => sanitize_text_field((string) ($session['id'] ?? '')),
        'status' => 'created',
        'raw' => wp_json_encode($session),
    ]);

    creava_security_audit_log('stripe_checkout_created', ['traceId' => $trace_id, 'sessionId' => (string) ($session['id'] ?? '')]);
    return rest_ensure_response([
        'url' => $session['url'] ?? null,
        'sessionId' => $session['id'] ?? null,
        'trace' => [
            ...creava_security_base_state($trace_id),
            'wordpressTraceId' => $trace_id,
            'wordpressStripeState' => 'session_created',
            'wordpressVerifiedAt' => gmdate('c'),
        ],
    ]);
}

function creava_create_billing_portal_session(WP_REST_Request $request) {
    $security_validation = creava_security_validate_public_rest_request($request, 'stripe_billing_portal');
    if ($security_validation instanceof WP_REST_Response) {
        return $security_validation;
    }

    $trace_id = wp_generate_uuid4();
    $user_id = creava_get_authenticated_user_id($request);

    if ($user_id <= 0) {
        return new WP_REST_Response([
            'error' => 'unauthorized',
            'message' => '有効な bearer トークンが必要です。',
            'trace' => [
                'wordpressTraceId' => $trace_id,
                'wordpressAuthState' => 'unauthorized',
                'wordpressVerifiedAt' => gmdate('c'),
            ],
        ], 401);
    }

    $customer_id = (string) get_user_meta($user_id, 'stripe_customer_id', true);
    if ($customer_id === '') {
        return new WP_REST_Response([
            'error' => 'customer_not_found',
            'message' => 'Stripe customer が紐づいていません。',
            'trace' => [
                'wordpressTraceId' => $trace_id,
                'wordpressAuthState' => 'authenticated',
                'wordpressCustomerState' => 'missing',
                'wordpressVerifiedAt' => gmdate('c'),
            ],
        ], 404);
    }

    $return_url = (string) (getenv('STRIPE_PORTAL_RETURN_URL') ?: home_url('/member'));
    if ($return_url === '') {
        return new WP_REST_Response([
            'error' => 'portal_return_url_missing',
            'message' => 'STRIPE_PORTAL_RETURN_URL が未設定です。',
            'trace' => [
                'wordpressTraceId' => $trace_id,
                'wordpressAuthState' => 'authenticated',
                'wordpressCustomerState' => 'ready',
                'wordpressConfigState' => 'invalid',
                'wordpressVerifiedAt' => gmdate('c'),
            ],
        ], 500);
    }

    $result = creava_stripe_post('/billing_portal/sessions', [
        'customer' => $customer_id,
        'return_url' => $return_url,
    ]);

    if (isset($result['error'])) {
        return new WP_REST_Response([
            ...$result,
            'trace' => [
                'wordpressTraceId' => $trace_id,
                'wordpressAuthState' => 'authenticated',
                'wordpressCustomerState' => 'ready',
                'wordpressStripeState' => 'failed',
                'wordpressVerifiedAt' => gmdate('c'),
            ],
        ], 502);
    }

    $session = (array) ($result['data'] ?? []);
    return rest_ensure_response([
        'url' => $session['url'] ?? null,
        'trace' => [
            'wordpressTraceId' => $trace_id,
            'wordpressAuthState' => 'authenticated',
            'wordpressCustomerState' => 'ready',
            'wordpressStripeState' => 'ready',
            'wordpressVerifiedAt' => gmdate('c'),
        ],
    ]);
}
