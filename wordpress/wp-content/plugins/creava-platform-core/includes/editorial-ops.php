<?php
if (!defined('ABSPATH')) { exit; }

function creava_ops_tracked_post_types(): array {
    return [
        'blog' => ['sourceSite' => 'main', 'label' => 'Blog'],
        'news' => ['sourceSite' => 'main', 'label' => 'News'],
        'event' => ['sourceSite' => 'main', 'label' => 'Events'],
        'work' => ['sourceSite' => 'main', 'label' => 'Works'],
        'store_product' => ['sourceSite' => 'store', 'label' => 'Store'],
        'fanclub_content' => ['sourceSite' => 'fc', 'label' => 'Fanclub'],
    ];
}

function creava_ops_get_post_locale(int $post_id): string {
    $raw_locale = (string) get_post_meta($post_id, 'locale', true);
    if ($raw_locale === '') {
        $raw_locale = (string) get_locale();
    }

    return strtolower(str_replace('_', '-', sanitize_text_field($raw_locale)));
}

function creava_ops_detect_publish_readiness(int $post_id): string {
    $seo_title = trim((string) get_post_meta($post_id, 'seo_title', true));
    $seo_description = trim((string) get_post_meta($post_id, 'seo_description', true));
    $canonical_url = trim((string) get_post_meta($post_id, 'canonical_url', true));
    $access_status = creava_normalize_access_status(get_post_meta($post_id, 'access_status', true));
    $thumbnail_id = (int) get_post_thumbnail_id($post_id);

    if ($access_status === 'limited') {
        $limited_end_at = creava_normalize_datetime_meta(get_post_meta($post_id, 'limited_end_at', true));
        if (!$limited_end_at) {
            return 'blocked_by_access';
        }
    }

    if ($seo_title === '' || $seo_description === '' || $canonical_url === '') {
        return 'blocked_by_seo';
    }

    if ($thumbnail_id <= 0) {
        return 'blocked_by_media';
    }

    $alt = trim((string) get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true));
    if ($alt === '') {
        return 'blocked_by_media';
    }

    $locale = creava_ops_get_post_locale($post_id);
    if (!in_array($locale, ['ja', 'en', 'ko', 'ja-jp', 'en-us', 'ko-kr'], true)) {
        return 'blocked_by_locale';
    }

    return 'ready';
}

function creava_ops_record_publish_audit(array $entry): void {
    $audit_limit = max((int) (getenv('CREAVA_EDITORIAL_AUDIT_LOG_LIMIT') ?: 300), 100);
    $stored = get_option('creava_publish_audit_log', []);
    if (!is_array($stored)) {
        $stored = [];
    }

    array_unshift($stored, $entry);
    if (count($stored) > $audit_limit) {
        $stored = array_slice($stored, 0, $audit_limit);
    }

    update_option('creava_publish_audit_log', $stored, false);
}

function creava_ops_transition_to_queue_state(string $new_status, string $readiness): string {
    if ($new_status === 'future') return 'scheduled_queue';
    if ($new_status === 'pending') return 'review_queue';
    if ($new_status === 'draft' || $new_status === 'auto-draft') return 'draft_queue';

    if ($new_status === 'publish') {
        return $readiness === 'ready' ? 'ready_to_publish_queue' : 'failed_publish_queue';
    }

    return 'dependency_warning_queue';
}

add_action('transition_post_status', static function (string $new_status, string $old_status, WP_Post $post): void {
    if ($new_status === $old_status) {
        return;
    }

    $tracked = creava_ops_tracked_post_types();
    if (!isset($tracked[$post->post_type])) {
        return;
    }

    $trace_id = wp_generate_uuid4();
    $readiness = creava_ops_detect_publish_readiness($post->ID);
    $queue_state = creava_ops_transition_to_queue_state($new_status, $readiness);

    creava_ops_record_publish_audit([
        'auditId' => $trace_id,
        'traceId' => $trace_id,
        'postId' => $post->ID,
        'postType' => $post->post_type,
        'title' => get_the_title($post),
        'slug' => $post->post_name,
        'locale' => creava_ops_get_post_locale($post->ID),
        'sourceSite' => $tracked[$post->post_type]['sourceSite'],
        'changedBy' => get_current_user_id() ?: 0,
        'changedByLabel' => wp_get_current_user()->display_name ?: 'system',
        'changedAt' => gmdate('c'),
        'oldStatus' => $old_status,
        'newStatus' => $new_status,
        'editorialQueueState' => $queue_state,
        'publishReadinessState' => $readiness,
        'revalidationState' => $new_status === 'publish' ? 'queued' : 'not_required',
        'cacheInvalidationState' => $new_status === 'publish' ? 'queued' : 'not_required',
        'previewLink' => home_url('/preview?type=' . rawurlencode($post->post_type) . '&slug=' . rawurlencode($post->post_name) . '&locale=' . rawurlencode(creava_ops_get_post_locale($post->ID))),
        'liveLink' => get_permalink($post) ?: '',
        'operatorActionState' => $readiness === 'ready' ? 'publish_or_schedule' : 'fix_quality_blockers',
    ]);
}, 20, 3);

function creava_ops_record_search_diagnostics(array $entry): void {
    $limit = max((int) (getenv('CREAVA_SEARCH_DIAGNOSTICS_LIMIT') ?: 400), 100);
    $stored = get_option('creava_search_diagnostics_log', []);
    if (!is_array($stored)) {
        $stored = [];
    }

    array_unshift($stored, $entry);
    if (count($stored) > $limit) {
        $stored = array_slice($stored, 0, $limit);
    }

    update_option('creava_search_diagnostics_log', $stored, false);
}

function creava_ops_normalize_file_hash(int $attachment_id): string {
    $existing = (string) get_post_meta($attachment_id, '_creava_file_hash', true);
    if ($existing !== '') {
        return $existing;
    }

    $path = get_attached_file($attachment_id);
    if (!$path || !file_exists($path)) {
        return '';
    }

    $hash = md5_file($path) ?: '';
    if ($hash !== '') {
        update_post_meta($attachment_id, '_creava_file_hash', $hash);
    }

    return $hash;
}

function creava_ops_build_editorial_dashboard_payload(WP_REST_Request $request): array {
    $tracked = creava_ops_tracked_post_types();
    $post_types = array_keys($tracked);
    $locale_filter = sanitize_text_field((string) $request->get_param('locale'));

    $query = new WP_Query([
        'post_type' => $post_types,
        'post_status' => ['draft', 'pending', 'future', 'publish', 'private'],
        'posts_per_page' => 250,
        'orderby' => 'modified',
        'order' => 'DESC',
    ]);

    $queue_counts = [
        'draft_queue' => 0,
        'review_queue' => 0,
        'ready_to_publish_queue' => 0,
        'scheduled_queue' => 0,
        'failed_publish_queue' => 0,
        'locale_incomplete_queue' => 0,
        'seo_incomplete_queue' => 0,
        'media_incomplete_queue' => 0,
        'dependency_warning_queue' => 0,
        'stale_content_queue' => 0,
    ];

    $queue_items = [];
    $quality_items = [];
    $now = time();

    foreach ($query->posts as $post) {
        $locale = creava_ops_get_post_locale($post->ID);
        if ($locale_filter !== '' && $locale_filter !== $locale) {
            continue;
        }

        $readiness = creava_ops_detect_publish_readiness($post->ID);
        $status = (string) $post->post_status;
        $queue_state = creava_ops_transition_to_queue_state($status, $readiness);
        $seo_ready = $readiness !== 'blocked_by_seo';
        $media_ready = $readiness !== 'blocked_by_media';
        $locale_ready = $readiness !== 'blocked_by_locale';
        $stale_days = (int) floor(($now - strtotime((string) $post->post_modified_gmt)) / DAY_IN_SECONDS);
        $stale_state = $stale_days >= 90 ? 'stale_content_queue' : 'healthy';

        $queue_counts[$queue_state] = ($queue_counts[$queue_state] ?? 0) + 1;
        if (!$locale_ready) $queue_counts['locale_incomplete_queue'] += 1;
        if (!$seo_ready) $queue_counts['seo_incomplete_queue'] += 1;
        if (!$media_ready) $queue_counts['media_incomplete_queue'] += 1;
        if ($stale_state === 'stale_content_queue') $queue_counts['stale_content_queue'] += 1;

        $item = [
            'id' => $post->ID,
            'type' => $post->post_type,
            'sourceSite' => $tracked[$post->post_type]['sourceSite'] ?? 'main',
            'title' => get_the_title($post),
            'slug' => $post->post_name,
            'status' => $status,
            'locale' => $locale,
            'editorialQueueState' => $queue_state,
            'publishReadinessState' => $readiness,
            'localeCompletenessState' => $locale_ready ? 'complete' : 'incomplete',
            'seoReadinessState' => $seo_ready ? 'ready' : 'blocked',
            'mediaCompletenessState' => $media_ready ? 'ready' : 'blocked',
            'staleContentState' => $stale_state === 'stale_content_queue' ? 'stale' : 'fresh',
            'opsPriorityState' => $readiness === 'ready' ? 'normal' : 'high',
            'operatorActionState' => $readiness === 'ready' ? 'publish_or_schedule' : 'fix_blockers',
            'previewLink' => home_url('/preview?type=' . rawurlencode($post->post_type) . '&slug=' . rawurlencode($post->post_name) . '&locale=' . rawurlencode($locale)),
            'liveLink' => get_permalink($post) ?: '',
            'updatedAt' => get_post_modified_time('c', true, $post),
        ];

        if (count($queue_items) < 60) {
            $queue_items[] = $item;
        }
        if ($readiness !== 'ready' && count($quality_items) < 60) {
            $quality_items[] = $item;
        }
    }

    $audit_logs = get_option('creava_publish_audit_log', []);
    if (!is_array($audit_logs)) {
        $audit_logs = [];
    }

    return [
        'generatedAt' => gmdate('c'),
        'opsTraceId' => wp_generate_uuid4(),
        'opsUpdatedAt' => gmdate('c'),
        'editorialOpsState' => 'active',
        'editorialQueueState' => $queue_counts,
        'publishReadinessState' => [
            'readyCount' => $queue_counts['ready_to_publish_queue'],
            'blockedByLocaleCount' => $queue_counts['locale_incomplete_queue'],
            'blockedBySeoCount' => $queue_counts['seo_incomplete_queue'],
            'blockedByMediaCount' => $queue_counts['media_incomplete_queue'],
            'failedPublishCount' => $queue_counts['failed_publish_queue'],
        ],
        'operatorActionState' => [
            'nextRecommendedAction' => $queue_counts['failed_publish_queue'] > 0 ? 'failed_publish_queue を優先確認' : 'locale/seo/media block を解消',
            'highPriorityCount' => $queue_counts['failed_publish_queue'] + $queue_counts['locale_incomplete_queue'] + $queue_counts['seo_incomplete_queue'] + $queue_counts['media_incomplete_queue'],
        ],
        'opsPriorityState' => $queue_counts['failed_publish_queue'] > 0 ? 'urgent' : 'normal',
        'queueItems' => $queue_items,
        'qualityActionItems' => $quality_items,
        'auditState' => [
            'totalCount' => count($audit_logs),
            'latestChangedAt' => (string) ($audit_logs[0]['changedAt'] ?? null),
        ],
    ];
}

function creava_ops_build_publish_audit_payload(): array {
    $logs = get_option('creava_publish_audit_log', []);
    if (!is_array($logs)) {
        $logs = [];
    }

    $summary = [
        'totalCount' => count($logs),
        'publishedCount' => 0,
        'failedCount' => 0,
        'queuedRevalidationCount' => 0,
        'localeDiffCount' => 0,
    ];

    $items = [];
    foreach (array_slice($logs, 0, 120) as $log) {
        $new_status = (string) ($log['newStatus'] ?? '');
        $readiness = (string) ($log['publishReadinessState'] ?? 'needs_review');
        if ($new_status === 'publish') $summary['publishedCount'] += 1;
        if ($readiness !== 'ready') $summary['failedCount'] += 1;
        if (($log['revalidationState'] ?? '') === 'queued') $summary['queuedRevalidationCount'] += 1;
        if (!in_array((string) ($log['locale'] ?? ''), ['ja', 'en', 'ko', 'ja-jp', 'en-us', 'ko-kr'], true)) $summary['localeDiffCount'] += 1;

        $items[] = [
            ...$log,
            'dependencyHealthState' => 'visible',
            'dependencyNote' => 'taxonomy / featured / navigation は公開前に手動確認',
            'rollbackNoteState' => 'available',
            'publishNoteState' => 'available',
            'where' => (string) ($log['sourceSite'] ?? 'main'),
        ];
    }

    return [
        'generatedAt' => gmdate('c'),
        'auditState' => $summary,
        'items' => $items,
    ];
}

function creava_ops_build_search_diagnostics_payload(): array {
    $logs = get_option('creava_search_diagnostics_log', []);
    if (!is_array($logs)) {
        $logs = [];
    }

    $by_query = [];
    foreach ($logs as $entry) {
        $query = trim((string) ($entry['query'] ?? ''));
        if ($query === '') continue;
        $key = mb_strtolower($query);

        if (!isset($by_query[$key])) {
            $by_query[$key] = [
                'query' => $query,
                'total' => 0,
                'zeroResultCount' => 0,
                'lowClickRiskCount' => 0,
                'localeMismatchRiskCount' => 0,
                'lastSeenAt' => null,
            ];
        }

        $by_query[$key]['total'] += 1;
        if ((int) ($entry['resultCount'] ?? 0) === 0) $by_query[$key]['zeroResultCount'] += 1;
        if ((string) ($entry['searchQualityState'] ?? '') === 'low_click_risk') $by_query[$key]['lowClickRiskCount'] += 1;
        if ((string) ($entry['searchQualityState'] ?? '') === 'locale_mismatch_risk') $by_query[$key]['localeMismatchRiskCount'] += 1;
        $by_query[$key]['lastSeenAt'] = (string) ($entry['at'] ?? null);
    }

    usort($by_query, static function (array $a, array $b): int {
        return $b['zeroResultCount'] <=> $a['zeroResultCount'];
    });

    return [
        'generatedAt' => gmdate('c'),
        'searchQualityState' => empty($by_query) ? 'needs_tuning' : 'underperforming',
        'summary' => [
            'trackedQueryCount' => count($by_query),
            'zeroResultRiskCount' => count(array_filter($by_query, static fn ($row) => $row['zeroResultCount'] > 0)),
            'lowClickRiskCount' => count(array_filter($by_query, static fn ($row) => $row['lowClickRiskCount'] > 0)),
            'localeMismatchRiskCount' => count(array_filter($by_query, static fn ($row) => $row['localeMismatchRiskCount'] > 0)),
        ],
        'queries' => array_values(array_slice($by_query, 0, 80)),
        'tuningRules' => [
            'localeAwareBoost' => 'enabled',
            'privateContentGuard' => 'enabled',
            'synonymRuleState' => 'ready_for_manual_config',
            'entityBoostRuleState' => 'ready_for_manual_config',
        ],
    ];
}

function creava_ops_build_asset_health_payload(): array {
    $attachments = get_posts([
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'posts_per_page' => 400,
        'orderby' => 'date',
        'order' => 'DESC',
    ]);

    $hash_buckets = [];
    $items = [];

    foreach ($attachments as $attachment) {
        $id = (int) $attachment->ID;
        $hash = creava_ops_normalize_file_hash($id);
        if ($hash !== '') {
            $hash_buckets[$hash][] = $id;
        }

        $url = wp_get_attachment_url($id) ?: '';
        $alt = trim((string) get_post_meta($id, '_wp_attachment_image_alt', true));

        $usage_query = new WP_Query([
            'post_type' => array_keys(creava_ops_tracked_post_types()),
            'post_status' => ['draft', 'pending', 'future', 'publish', 'private'],
            'posts_per_page' => 5,
            'meta_query' => [[
                'key' => '_thumbnail_id',
                'value' => $id,
                'compare' => '=',
            ]],
        ]);

        $usage_count = (int) $usage_query->found_posts;
        $asset_state = 'healthy';
        if ($usage_count === 0) $asset_state = 'orphan_candidate';
        if ($alt === '') $asset_state = 'metadata_incomplete';

        $items[] = [
            'id' => $id,
            'title' => get_the_title($id),
            'url' => $url,
            'hash' => $hash,
            'usageCount' => $usage_count,
            'assetHealthState' => $asset_state,
            'safeDeleteState' => $usage_count === 0 ? 'manual_review_required' : 'blocked',
            'safeMergeState' => 'manual_review_required',
            'canonicalCandidateState' => $hash !== '' ? 'available' : 'unavailable',
            'metadataState' => $alt === '' ? 'missing_alt' : 'complete',
        ];
    }

    $duplicate_candidates = [];
    foreach ($hash_buckets as $hash => $ids) {
        if (count($ids) < 2) {
            continue;
        }

        $duplicate_candidates[] = [
            'hash' => $hash,
            'attachmentIds' => $ids,
            'canonicalAssetId' => $ids[0],
            'duplicateCount' => count($ids),
            'workflowState' => 'candidate_only',
            'operatorActionState' => 'review_and_replace_reference',
        ];
    }

    return [
        'generatedAt' => gmdate('c'),
        'assetHealthState' => empty($duplicate_candidates) ? 'healthy' : 'duplicate_candidate',
        'summary' => [
            'totalAssets' => count($items),
            'duplicateCandidateCount' => count($duplicate_candidates),
            'orphanCandidateCount' => count(array_filter($items, static fn ($asset) => $asset['assetHealthState'] === 'orphan_candidate')),
            'metadataIncompleteCount' => count(array_filter($items, static fn ($asset) => $asset['metadataState'] !== 'complete')),
        ],
        'duplicateCandidates' => array_slice($duplicate_candidates, 0, 80),
        'assets' => array_slice($items, 0, 160),
        'safetyPolicy' => [
            'destructiveDefaultState' => 'disabled',
            'autoMergeState' => 'disabled',
            'safeArchiveRule' => 'unused_for_30d_and_not_featured',
            'safeDeleteRule' => 'manual_approval_and_backup_confirmed',
        ],
    ];
}

function creava_ops_build_content_quality_payload(WP_REST_Request $request): array {
    $dashboard = creava_ops_build_editorial_dashboard_payload($request);
    $search = creava_ops_build_search_diagnostics_payload();
    $asset = creava_ops_build_asset_health_payload();

    return [
        'generatedAt' => gmdate('c'),
        'contentQualityState' => 'active',
        'localeCompletenessState' => $dashboard['publishReadinessState']['blockedByLocaleCount'] > 0 ? 'incomplete' : 'complete',
        'seoReadinessState' => $dashboard['publishReadinessState']['blockedBySeoCount'] > 0 ? 'needs_fix' : 'ready',
        'mediaCompletenessState' => $dashboard['publishReadinessState']['blockedByMediaCount'] > 0 ? 'needs_fix' : 'ready',
        'dependencyHealthState' => 'manual_review_required',
        'staleContentState' => ($dashboard['editorialQueueState']['stale_content_queue'] ?? 0) > 0 ? 'stale_detected' : 'healthy',
        'searchQualityState' => $search['searchQualityState'],
        'assetHealthState' => $asset['assetHealthState'],
        'prePublishChecklist' => [
            'locale_completeness',
            'seo_title_description_canonical',
            'featured_image_alt',
            'taxonomy_dependency_review',
            'access_status_membership_review',
        ],
        'postPublishChecklist' => [
            'preview_vs_live_diff_check',
            'revalidation_status_check',
            'cache_invalidation_status_check',
            'search_result_presence_check',
        ],
        'weeklyReviewFocus' => [
            'no_result_query_top20',
            'low_click_query_top20',
            'stale_content_queue',
            'duplicate_asset_candidates',
        ],
        'monthlyReviewFocus' => [
            'locale_coverage',
            'seo_completeness_rate',
            'asset_orphan_cleanup_candidates',
            'taxonomy_dependency_consistency',
        ],
    ];
}

function creava_ops_can_access_dashboard(WP_REST_Request $request): bool {
    if (current_user_can('edit_posts')) {
        return true;
    }

    $provided = sanitize_text_field((string) $request->get_header('x-creava-ops-token'));
    $expected = (string) (getenv('WORDPRESS_EDITORIAL_OPS_TOKEN') ?: '');

    return $provided !== '' && $expected !== '' && hash_equals($expected, $provided);
}

function creava_register_editorial_ops_routes(): void {
    register_rest_route('creava/v1', '/ops/editorial-dashboard', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_editorial_dashboard_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/publish-audit', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_publish_audit_payload());
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/search-diagnostics', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_search_diagnostics_payload());
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/asset-health', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_asset_health_payload());
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/content-quality', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_content_quality_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);
}

function creava_render_ops_dashboard_page(): void {
    if (!current_user_can('edit_posts')) {
        wp_die('権限がありません。');
    }

    $request = new WP_REST_Request('GET', '/creava/v1/ops/editorial-dashboard');
    $dashboard = creava_ops_build_editorial_dashboard_payload($request);
    $audit = creava_ops_build_publish_audit_payload();
    $search = creava_ops_build_search_diagnostics_payload();
    $asset = creava_ops_build_asset_health_payload();
    $quality = creava_ops_build_content_quality_payload($request);

    echo '<div class="wrap">';
    echo '<h1>Creava Editorial Ops Dashboard</h1>';
    echo '<p>編集の優先度と公開監査、検索品質、アセット重複候補、品質チェックを同じ判断軸で表示します。</p>';

    echo '<h2>1) Editorial Queue / Publish Readiness</h2>';
    echo '<p>high priority: ' . esc_html((string) $dashboard['operatorActionState']['highPriorityCount']) . ' / next: ' . esc_html((string) $dashboard['operatorActionState']['nextRecommendedAction']) . '</p>';
    echo '<pre>' . esc_html(wp_json_encode($dashboard['editorialQueueState'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<h2>2) Publish Audit</h2>';
    echo '<p>published: ' . esc_html((string) $audit['auditState']['publishedCount']) . ' / failed-like: ' . esc_html((string) $audit['auditState']['failedCount']) . '</p>';
    echo '<pre>' . esc_html(wp_json_encode(array_slice($audit['items'], 0, 10), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<h2>3) Search Diagnostics</h2>';
    echo '<p>zero result risk: ' . esc_html((string) $search['summary']['zeroResultRiskCount']) . ' / locale mismatch risk: ' . esc_html((string) $search['summary']['localeMismatchRiskCount']) . '</p>';
    echo '<pre>' . esc_html(wp_json_encode(array_slice($search['queries'], 0, 10), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<h2>4) Asset Deduplication / Governance</h2>';
    echo '<p>duplicate candidates: ' . esc_html((string) $asset['summary']['duplicateCandidateCount']) . ' / orphan candidates: ' . esc_html((string) $asset['summary']['orphanCandidateCount']) . '</p>';
    echo '<pre>' . esc_html(wp_json_encode(array_slice($asset['duplicateCandidates'], 0, 10), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<h2>5) Content Quality Ops</h2>';
    echo '<pre>' . esc_html(wp_json_encode($quality, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<p><strong>Actionability:</strong> queue と audit と quality は別物です。Queue で「何を直すか」、Audit で「誰が何を出したか」、Quality で「公開前後の品質」を判断してください。</p>';
    echo '</div>';
}

add_action('admin_menu', static function (): void {
    add_menu_page(
        'Editorial Ops',
        'Editorial Ops',
        'edit_posts',
        'creava-editorial-ops',
        'creava_render_ops_dashboard_page',
        'dashicons-analytics',
        58
    );
});
