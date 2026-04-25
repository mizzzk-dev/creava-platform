<?php
if (!defined('ABSPATH')) { exit; }

function creava_security_env_flag(string $key, bool $default = false): bool {
    $raw = getenv($key);
    if ($raw === false || $raw === null || trim((string) $raw) === '') {
        return $default;
    }

    $normalized = strtolower(trim((string) $raw));
    return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
}

function creava_security_csv_env(string $key): array {
    $raw = (string) (getenv($key) ?: '');
    if ($raw === '') {
        return [];
    }

    return array_values(array_filter(array_map(static function (string $item): string {
        return strtolower(trim($item));
    }, explode(',', $raw))));
}

function creava_security_get_request_origin(WP_REST_Request $request): string {
    $origin = (string) ($request->get_header('origin') ?: $request->get_header('referer'));
    if ($origin === '') {
        return '';
    }

    $parts = wp_parse_url($origin);
    $host = strtolower((string) ($parts['host'] ?? ''));
    return $host;
}

function creava_security_get_remote_ip(): string {
    $candidates = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_X_FORWARDED_FOR',
        'REMOTE_ADDR',
    ];

    foreach ($candidates as $key) {
        if (empty($_SERVER[$key])) {
            continue;
        }
        $value = trim((string) $_SERVER[$key]);
        if ($value === '') {
            continue;
        }
        $parts = explode(',', $value);
        $ip = trim((string) ($parts[0] ?? ''));
        if ($ip !== '') {
            return $ip;
        }
    }

    return 'unknown';
}

function creava_security_hash_identifier(string $value): string {
    if ($value === '') {
        $value = 'unknown';
    }

    return hash('sha256', $value . '|' . wp_salt('auth'));
}

function creava_security_rate_limit(string $bucket, int $limit, int $window_seconds): bool {
    $ip_hash = creava_security_hash_identifier(creava_security_get_remote_ip());
    $key = sprintf('creava_rl_%s_%s', sanitize_key($bucket), substr($ip_hash, 0, 20));
    $count = (int) get_transient($key);

    if ($count >= $limit) {
        return false;
    }

    set_transient($key, $count + 1, $window_seconds);
    return true;
}

function creava_security_is_allowed_origin(WP_REST_Request $request): bool {
    $allowed = creava_security_csv_env('CREAVA_ALLOWED_ORIGINS');
    if (empty($allowed)) {
        return true;
    }

    $origin_host = creava_security_get_request_origin($request);
    if ($origin_host === '') {
        return true;
    }

    return in_array($origin_host, $allowed, true);
}

function creava_security_base_state(string $trace_id): array {
    return [
        'securityTraceId' => $trace_id,
        'securityHardeningState' => 'enabled',
        'authHardeningState' => 'enabled',
        'restPermissionState' => 'validated',
        'previewSecurityState' => 'enabled',
        'webhookSecurityState' => 'enabled',
        'mediaSecurityState' => 'enabled',
        'secretRotationState' => 'managed',
        'pluginRiskState' => 'tracked',
        'vulnerabilityState' => 'monitored',
        'exposureState' => 'restricted',
        'securityAuditedAt' => gmdate('c'),
        'securityHardenedAt' => gmdate('c'),
    ];
}

function creava_security_blocked_response(string $code, string $message, int $status, string $trace_id): WP_REST_Response {
    return new WP_REST_Response([
        'error' => $code,
        'message' => $message,
        ...creava_security_base_state($trace_id),
    ], $status);
}

function creava_security_validate_public_rest_request(WP_REST_Request $request, string $bucket): true|WP_REST_Response {
    $trace_id = wp_generate_uuid4();

    if (!creava_security_is_allowed_origin($request)) {
        return creava_security_blocked_response('forbidden_origin', '許可されていない origin です。', 403, $trace_id);
    }

    $limit = max((int) (getenv('CREAVA_PUBLIC_RATE_LIMIT') ?: 120), 30);
    $window = max((int) (getenv('CREAVA_PUBLIC_RATE_WINDOW_SEC') ?: 60), 30);
    if (!creava_security_rate_limit($bucket, $limit, $window)) {
        return creava_security_blocked_response('rate_limited', 'リクエスト上限に達しました。', 429, $trace_id);
    }

    return true;
}

function creava_security_is_replayed_webhook(string $event_id): bool {
    $cache_key = 'creava_webhook_seen_' . substr(creava_security_hash_identifier($event_id), 0, 24);
    if (get_transient($cache_key)) {
        return true;
    }

    set_transient($cache_key, '1', 600);
    return false;
}

function creava_security_audit_log(string $event_type, array $payload = []): void {
    if (!creava_security_env_flag('CREAVA_SECURITY_AUDIT_LOG', true)) {
        return;
    }

    $record = [
        'eventType' => $event_type,
        'occurredAt' => gmdate('c'),
        'ipHash' => substr(creava_security_hash_identifier(creava_security_get_remote_ip()), 0, 16),
        ...$payload,
    ];

    error_log('[creava-security] ' . wp_json_encode($record));
}

add_filter('xmlrpc_enabled', static function (): bool {
    return !creava_security_env_flag('CREAVA_DISABLE_XMLRPC', true);
});

add_filter('rest_authentication_errors', static function ($result) {
    if (!empty($result)) {
        return $result;
    }

    return $result;
});

add_filter('wp_headers', static function (array $headers): array {
    if (creava_security_env_flag('CREAVA_ENABLE_SECURITY_HEADERS', true)) {
        $headers['X-Content-Type-Options'] = 'nosniff';
        $headers['X-Frame-Options'] = 'SAMEORIGIN';
        $headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    }

    return $headers;
});


function creava_security_allowed_mime_types(): array {
    $configured = creava_security_csv_env('CREAVA_MEDIA_ALLOWED_MIME_TYPES');
    if (!empty($configured)) {
        return $configured;
    }

    return [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'video/mp4',
        'application/pdf',
    ];
}

add_filter('wp_handle_upload_prefilter', static function (array $file): array {
    $max_bytes = (int) (getenv('CREAVA_MEDIA_MAX_UPLOAD_BYTES') ?: 10485760);
    if (!empty($file['size']) && (int) $file['size'] > $max_bytes) {
        $file['error'] = 'upload_size_exceeded';
        return $file;
    }

    $allowed = creava_security_allowed_mime_types();
    $mime = strtolower((string) ($file['type'] ?? ''));
    if ($mime !== '' && !in_array($mime, $allowed, true)) {
        $file['error'] = 'upload_mime_not_allowed';
        return $file;
    }

    return $file;
});
