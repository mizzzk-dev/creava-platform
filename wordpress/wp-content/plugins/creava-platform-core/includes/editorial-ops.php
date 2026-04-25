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

function creava_ops_collect_post_dependencies(int $post_id): array {
    $dependencies = [];

    $taxonomy_objects = get_object_taxonomies(get_post_type($post_id), 'objects');
    if (is_array($taxonomy_objects)) {
        foreach ($taxonomy_objects as $taxonomy => $taxonomy_object) {
            $terms = wp_get_post_terms($post_id, $taxonomy, ['fields' => 'ids']);
            if (is_wp_error($terms) || empty($terms)) {
                continue;
            }

            foreach ($terms as $term_id) {
                $dependencies[] = [
                    'type' => 'taxonomy',
                    'dependencyKey' => sprintf('taxonomy:%s:%d', $taxonomy, (int) $term_id),
                    'label' => sprintf('%s term #%d', (string) ($taxonomy_object->label ?: $taxonomy), (int) $term_id),
                    'severity' => 'medium',
                ];
            }
        }
    }

    $thumbnail_id = (int) get_post_thumbnail_id($post_id);
    if ($thumbnail_id > 0) {
        $dependencies[] = [
            'type' => 'asset',
            'dependencyKey' => sprintf('asset:%d', $thumbnail_id),
            'label' => sprintf('featured_asset:%d', $thumbnail_id),
            'severity' => 'medium',
        ];
    }

    $featured_raw = get_post_meta($post_id, 'featured_content_ids', true);
    if (is_array($featured_raw)) {
        $featured_ids = array_map('intval', $featured_raw);
    } else {
        $featured_ids = array_filter(array_map('intval', explode(',', (string) $featured_raw)));
    }

    foreach ($featured_ids as $related_id) {
        if ($related_id <= 0 || get_post_status($related_id) === false) {
            continue;
        }

        $dependencies[] = [
            'type' => 'content',
            'dependencyKey' => sprintf('content:%d', $related_id),
            'label' => sprintf('related_content:%d', $related_id),
            'severity' => 'high',
        ];
    }

    $access_status = creava_normalize_access_status(get_post_meta($post_id, 'access_status', true));
    if (in_array($access_status, ['fc_only', 'limited'], true)) {
        $dependencies[] = [
            'type' => 'membership',
            'dependencyKey' => sprintf('membership:%s', $access_status),
            'label' => sprintf('membership:%s', $access_status),
            'severity' => 'high',
        ];
    }

    return $dependencies;
}

function creava_ops_detect_release_risk(string $readiness, string $locale, array $dependencies): string {
    if ($readiness !== 'ready') {
        if ($readiness === 'blocked_by_locale') return 'locale_risk';
        if ($readiness === 'blocked_by_seo') return 'seo_risk';
        if ($readiness === 'blocked_by_media') return 'cache_risk';
        if ($readiness === 'blocked_by_access') return 'membership_risk';
        return 'needs_manual_check';
    }

    foreach ($dependencies as $dependency) {
        if (($dependency['type'] ?? '') === 'membership') {
            return 'membership_risk';
        }
        if (($dependency['severity'] ?? '') === 'high') {
            return 'dependency_risk';
        }
    }

    if (!in_array($locale, ['ja', 'en', 'ko', 'ja-jp', 'en-us', 'ko-kr'], true)) {
        return 'locale_risk';
    }

    return 'healthy';
}

function creava_ops_detect_publish_risk(string $queue_state, string $release_risk): string {
    if ($queue_state === 'failed_publish_queue') return 'high';
    if ($release_risk === 'healthy') return 'low';
    if (in_array($release_risk, ['dependency_risk', 'needs_manual_check'], true)) return 'medium';
    return 'high';
}

function creava_ops_resolve_due_at(WP_Post $post): ?int {
    $candidates = [
        (string) get_post_meta($post->ID, 'editorial_due_at', true),
        (string) get_post_meta($post->ID, 'release_due_at', true),
        (string) get_post_meta($post->ID, 'publish_deadline', true),
        (string) $post->post_date_gmt,
    ];

    foreach ($candidates as $candidate) {
        $normalized = creava_normalize_datetime_meta($candidate);
        if ($normalized) {
            $ts = strtotime($normalized);
            if ($ts !== false) {
                return $ts;
            }
        }
    }

    return null;
}

function creava_ops_detect_editorial_sla_state(string $queue_state, string $readiness, ?int $due_at, int $dependency_count): string {
    $now = time();
    if ($queue_state === 'review_queue') return 'waiting_review';
    if ($queue_state === 'dependency_warning_queue' || $dependency_count > 4) return 'waiting_dependency';
    if ($queue_state === 'scheduled_queue') return 'waiting_publish_window';
    if ($readiness !== 'ready') return 'blocked';
    if ($due_at !== null && $due_at < $now) return 'overdue';
    if ($due_at !== null && ($due_at - $now) < DAY_IN_SECONDS) return 'at_risk';
    return 'on_track';
}

function creava_ops_detect_overdue_state(?int $due_at, string $sla_state): string {
    if ($sla_state === 'overdue') {
        return 'overdue';
    }
    if ($due_at === null) {
        return 'not_set';
    }
    return $due_at < time() ? 'overdue' : 'not_overdue';
}

function creava_ops_detect_blocked_state(string $readiness, string $queue_state): string {
    if ($readiness !== 'ready') return 'blocked';
    if ($queue_state === 'dependency_warning_queue') return 'blocked_by_dependency';
    return 'not_blocked';
}

function creava_ops_detect_priority_state(string $sla_state, string $publish_risk, string $queue_state): string {
    if ($sla_state === 'overdue' || $queue_state === 'failed_publish_queue') return 'critical';
    if ($sla_state === 'blocked' || $publish_risk === 'high') return 'high';
    if ($sla_state === 'at_risk' || $publish_risk === 'medium') return 'medium';
    return 'low';
}

function creava_ops_detect_escalation_state(string $sla_state, string $priority): string {
    if ($sla_state === 'overdue' || $priority === 'critical') return 'escalated_to_admin';
    if ($sla_state === 'blocked') return 'escalated_to_reviewer';
    if ($sla_state === 'at_risk') return 'reminder_sent';
    return 'none';
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
    $sla_counts = [
        'on_track' => 0,
        'at_risk' => 0,
        'overdue' => 0,
        'blocked' => 0,
        'waiting_review' => 0,
        'waiting_dependency' => 0,
        'waiting_publish_window' => 0,
    ];
    $priority_counts = [
        'critical' => 0,
        'high' => 0,
        'medium' => 0,
        'low' => 0,
        'deferred' => 0,
    ];
    $publish_risk_counts = [
        'low' => 0,
        'medium' => 0,
        'high' => 0,
    ];
    $release_risk_counts = [
        'healthy' => 0,
        'dependency_risk' => 0,
        'locale_risk' => 0,
        'seo_risk' => 0,
        'membership_risk' => 0,
        'cache_risk' => 0,
        'needs_manual_check' => 0,
    ];
    $operator_load = [];
    $blocked_count = 0;
    $overdue_count = 0;
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
        $dependencies = creava_ops_collect_post_dependencies((int) $post->ID);
        $due_at = creava_ops_resolve_due_at($post);
        $release_risk = creava_ops_detect_release_risk($readiness, $locale, $dependencies);
        $publish_risk = creava_ops_detect_publish_risk($queue_state, $release_risk);
        $sla_state = creava_ops_detect_editorial_sla_state($queue_state, $readiness, $due_at, count($dependencies));
        $overdue_state = creava_ops_detect_overdue_state($due_at, $sla_state);
        $blocked_state = creava_ops_detect_blocked_state($readiness, $queue_state);
        $priority_state = creava_ops_detect_priority_state($sla_state, $publish_risk, $queue_state);
        $escalation_state = creava_ops_detect_escalation_state($sla_state, $priority_state);

        $queue_counts[$queue_state] = ($queue_counts[$queue_state] ?? 0) + 1;
        if (!$locale_ready) $queue_counts['locale_incomplete_queue'] += 1;
        if (!$seo_ready) $queue_counts['seo_incomplete_queue'] += 1;
        if (!$media_ready) $queue_counts['media_incomplete_queue'] += 1;
        if ($stale_state === 'stale_content_queue') $queue_counts['stale_content_queue'] += 1;
        $sla_counts[$sla_state] = ($sla_counts[$sla_state] ?? 0) + 1;
        $priority_counts[$priority_state] = ($priority_counts[$priority_state] ?? 0) + 1;
        $publish_risk_counts[$publish_risk] = ($publish_risk_counts[$publish_risk] ?? 0) + 1;
        $release_risk_counts[$release_risk] = ($release_risk_counts[$release_risk] ?? 0) + 1;
        if ($blocked_state !== 'not_blocked') $blocked_count += 1;
        if ($overdue_state === 'overdue') $overdue_count += 1;

        $owner_id = (int) $post->post_author;
        if (!isset($operator_load[$owner_id])) {
            $operator_load[$owner_id] = [
                'ownerId' => $owner_id,
                'ownerLabel' => get_the_author_meta('display_name', $owner_id) ?: sprintf('user#%d', $owner_id),
                'assignedCount' => 0,
                'criticalCount' => 0,
                'blockedCount' => 0,
            ];
        }
        $operator_load[$owner_id]['assignedCount'] += 1;
        if ($priority_state === 'critical') $operator_load[$owner_id]['criticalCount'] += 1;
        if ($blocked_state !== 'not_blocked') $operator_load[$owner_id]['blockedCount'] += 1;

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
            'editorialSlaState' => $sla_state,
            'queuePriorityState' => $priority_state,
            'operatorLoadState' => 'balanced',
            'publishRiskState' => $publish_risk,
            'releaseRiskState' => $release_risk,
            'dependencyImpactState' => count($dependencies) > 0 ? 'detected' : 'none',
            'dependencyCount' => count($dependencies),
            'dependencySeverityState' => count(array_filter($dependencies, static fn ($dep) => ($dep['severity'] ?? '') === 'high')) > 0 ? 'high' : 'normal',
            'dependencies' => array_slice($dependencies, 0, 12),
            'escalationState' => $escalation_state,
            'reminderState' => in_array($sla_state, ['at_risk', 'overdue', 'blocked'], true) ? 'scheduled' : 'none',
            'assignmentState' => $owner_id > 0 ? 'assigned' : 'unassigned',
            'blockedState' => $blocked_state,
            'overdueState' => $overdue_state,
            'reviewCadenceState' => $status === 'pending' ? 'daily_review' : 'weekly_review',
            'localeCompletenessState' => $locale_ready ? 'complete' : 'incomplete',
            'seoReadinessState' => $seo_ready ? 'ready' : 'blocked',
            'mediaCompletenessState' => $media_ready ? 'ready' : 'blocked',
            'staleContentState' => $stale_state === 'stale_content_queue' ? 'stale' : 'fresh',
            'opsPriorityState' => $priority_state,
            'operatorActionState' => $readiness === 'ready' ? 'publish_or_schedule' : 'fix_blockers',
            'ownerId' => $owner_id,
            'ownerLabel' => get_the_author_meta('display_name', $owner_id) ?: '',
            'dueAt' => $due_at ? gmdate('c', $due_at) : null,
            'opsTraceId' => wp_generate_uuid4(),
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

    foreach ($operator_load as &$load) {
        if ($load['assignedCount'] >= 12 || $load['criticalCount'] >= 3) {
            $load['operatorLoadState'] = 'overloaded';
        } elseif ($load['assignedCount'] <= 2) {
            $load['operatorLoadState'] = 'underutilized';
        } elseif ($load['blockedCount'] > 0) {
            $load['operatorLoadState'] = 'blocked_by_dependency';
        } else {
            $load['operatorLoadState'] = 'balanced';
        }
    }
    unset($load);

    return [
        'generatedAt' => gmdate('c'),
        'opsTraceId' => wp_generate_uuid4(),
        'opsUpdatedAt' => gmdate('c'),
        'editorialOpsState' => 'active',
        'editorialSlaState' => $sla_counts,
        'editorialQueueState' => $queue_counts,
        'queuePriorityState' => $priority_counts,
        'publishRiskState' => $publish_risk_counts,
        'releaseRiskState' => $release_risk_counts,
        'dependencyImpactState' => [
            'highSeverityCount' => count(array_filter($queue_items, static fn ($item) => ($item['dependencySeverityState'] ?? 'normal') === 'high')),
            'detectedCount' => count(array_filter($queue_items, static fn ($item) => ($item['dependencyImpactState'] ?? '') === 'detected')),
        ],
        'overdueState' => [
            'overdueCount' => $overdue_count,
            'notSetCount' => count(array_filter($queue_items, static fn ($item) => ($item['overdueState'] ?? '') === 'not_set')),
        ],
        'blockedState' => [
            'blockedCount' => $blocked_count,
            'blockedByReadinessCount' => count(array_filter($queue_items, static fn ($item) => ($item['blockedState'] ?? '') === 'blocked')),
            'blockedByDependencyCount' => count(array_filter($queue_items, static fn ($item) => ($item['blockedState'] ?? '') === 'blocked_by_dependency')),
        ],
        'operatorLoadState' => array_values($operator_load),
        'reviewCadenceState' => [
            'dailyReviewQueueCount' => count(array_filter($queue_items, static fn ($item) => ($item['reviewCadenceState'] ?? '') === 'daily_review')),
            'weeklyReviewQueueCount' => count(array_filter($queue_items, static fn ($item) => ($item['reviewCadenceState'] ?? '') === 'weekly_review')),
        ],
        'escalationState' => [
            'none' => count(array_filter($queue_items, static fn ($item) => ($item['escalationState'] ?? '') === 'none')),
            'reminder_sent' => count(array_filter($queue_items, static fn ($item) => ($item['escalationState'] ?? '') === 'reminder_sent')),
            'escalated_to_reviewer' => count(array_filter($queue_items, static fn ($item) => ($item['escalationState'] ?? '') === 'escalated_to_reviewer')),
            'escalated_to_admin' => count(array_filter($queue_items, static fn ($item) => ($item['escalationState'] ?? '') === 'escalated_to_admin')),
        ],
        'reminderState' => [
            'scheduledCount' => count(array_filter($queue_items, static fn ($item) => ($item['reminderState'] ?? '') === 'scheduled')),
            'noneCount' => count(array_filter($queue_items, static fn ($item) => ($item['reminderState'] ?? '') === 'none')),
        ],
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
        'opsPriorityState' => $priority_counts['critical'] > 0 ? 'urgent' : 'normal',
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

function creava_ops_build_dependency_graph_payload(WP_REST_Request $request): array {
    $dashboard = creava_ops_build_editorial_dashboard_payload($request);
    $nodes = [];
    $edges = [];
    $impact_summary = [
        'publishRiskImpactCount' => 0,
        'revalidationScopeCount' => 0,
        'localeImpactCount' => 0,
        'membershipImpactCount' => 0,
        'searchImpactCount' => 0,
    ];

    foreach ($dashboard['queueItems'] as $item) {
        $content_node_id = sprintf('content:%d', (int) ($item['id'] ?? 0));
        $nodes[$content_node_id] = [
            'id' => $content_node_id,
            'type' => 'content',
            'label' => (string) ($item['title'] ?? ''),
            'site' => (string) ($item['sourceSite'] ?? 'main'),
            'locale' => (string) ($item['locale'] ?? 'ja'),
            'editorialSlaState' => (string) ($item['editorialSlaState'] ?? 'on_track'),
            'queuePriorityState' => (string) ($item['queuePriorityState'] ?? 'low'),
            'publishRiskState' => (string) ($item['publishRiskState'] ?? 'low'),
            'releaseRiskState' => (string) ($item['releaseRiskState'] ?? 'healthy'),
        ];

        $impact_summary['revalidationScopeCount'] += 1;
        if (($item['publishRiskState'] ?? 'low') !== 'low') $impact_summary['publishRiskImpactCount'] += 1;
        if (($item['localeCompletenessState'] ?? 'complete') !== 'complete') $impact_summary['localeImpactCount'] += 1;

        $dependencies = is_array($item['dependencies'] ?? null) ? $item['dependencies'] : [];
        foreach ($dependencies as $dependency) {
            $dep_key = (string) ($dependency['dependencyKey'] ?? '');
            if ($dep_key === '') {
                continue;
            }
            if (!isset($nodes[$dep_key])) {
                $nodes[$dep_key] = [
                    'id' => $dep_key,
                    'type' => (string) ($dependency['type'] ?? 'unknown'),
                    'label' => (string) ($dependency['label'] ?? $dep_key),
                    'severity' => (string) ($dependency['severity'] ?? 'medium'),
                ];
            }

            $edges[] = [
                'from' => $content_node_id,
                'to' => $dep_key,
                'severity' => (string) ($dependency['severity'] ?? 'medium'),
                'impactState' => 'active',
                'publishRiskState' => (string) ($item['publishRiskState'] ?? 'low'),
                'localeImpactState' => (string) ($item['localeCompletenessState'] ?? 'complete'),
                'revalidationState' => 'queued_on_publish',
            ];

            if (($dependency['type'] ?? '') === 'membership') $impact_summary['membershipImpactCount'] += 1;
            if (($dependency['type'] ?? '') === 'taxonomy') $impact_summary['searchImpactCount'] += 1;
        }
    }

    return [
        'generatedAt' => gmdate('c'),
        'opsTraceId' => wp_generate_uuid4(),
        'dependencyGraphState' => 'active',
        'dependencySeverityState' => [
            'high' => count(array_filter($edges, static fn ($edge) => ($edge['severity'] ?? '') === 'high')),
            'medium' => count(array_filter($edges, static fn ($edge) => ($edge['severity'] ?? '') === 'medium')),
            'low' => count(array_filter($edges, static fn ($edge) => ($edge['severity'] ?? '') === 'low')),
        ],
        'brokenDependencyState' => [
            'brokenCount' => count(array_filter($edges, static fn ($edge) => ($edge['to'] ?? '') === '')),
            'staleCount' => count(array_filter($dashboard['queueItems'], static fn ($item) => ($item['staleContentState'] ?? '') === 'stale')),
        ],
        'impactSummary' => $impact_summary,
        'publishImpactPreview' => array_slice($dashboard['queueItems'], 0, 20),
        'nodes' => array_values($nodes),
        'edges' => array_slice($edges, 0, 300),
    ];
}

function creava_ops_build_release_calendar_payload(WP_REST_Request $request): array {
    $dashboard = creava_ops_build_editorial_dashboard_payload($request);
    $calendar = [];
    $publish_queue = [];

    foreach ($dashboard['queueItems'] as $item) {
        $due_at = (string) ($item['dueAt'] ?? '');
        $date_key = $due_at !== '' ? substr($due_at, 0, 10) : gmdate('Y-m-d');
        if (!isset($calendar[$date_key])) {
            $calendar[$date_key] = [
                'date' => $date_key,
                'items' => [],
                'releaseRiskState' => 'healthy',
            ];
        }

        $calendar[$date_key]['items'][] = [
            'id' => $item['id'] ?? null,
            'title' => $item['title'] ?? '',
            'site' => $item['sourceSite'] ?? 'main',
            'locale' => $item['locale'] ?? 'ja',
            'status' => $item['status'] ?? 'draft',
            'queuePriorityState' => $item['queuePriorityState'] ?? 'low',
            'editorialSlaState' => $item['editorialSlaState'] ?? 'on_track',
            'releaseRiskState' => $item['releaseRiskState'] ?? 'healthy',
            'publishRiskState' => $item['publishRiskState'] ?? 'low',
            'assignee' => $item['ownerLabel'] ?? '',
            'dependencyCount' => $item['dependencyCount'] ?? 0,
        ];

        if (($item['releaseRiskState'] ?? 'healthy') !== 'healthy') {
            $calendar[$date_key]['releaseRiskState'] = 'dependency_risk';
        }

        $publish_queue[] = [
            'id' => $item['id'] ?? null,
            'title' => $item['title'] ?? '',
            'site' => $item['sourceSite'] ?? 'main',
            'locale' => $item['locale'] ?? 'ja',
            'queuePriorityState' => $item['queuePriorityState'] ?? 'low',
            'editorialSlaState' => $item['editorialSlaState'] ?? 'on_track',
            'blockedState' => $item['blockedState'] ?? 'not_blocked',
            'overdueState' => $item['overdueState'] ?? 'not_overdue',
            'publishRiskState' => $item['publishRiskState'] ?? 'low',
            'releaseRiskState' => $item['releaseRiskState'] ?? 'healthy',
            'assignee' => $item['ownerLabel'] ?? '',
            'deadline' => $item['dueAt'] ?? null,
            'finalCheckState' => ($item['publishReadinessState'] ?? 'ready') === 'ready' ? 'ready' : 'needs_manual_check',
            'postPublishVerificationState' => 'required',
        ];
    }

    usort($publish_queue, static function (array $a, array $b): int {
        $priority_order = ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3, 'deferred' => 4];
        return ($priority_order[$a['queuePriorityState']] ?? 99) <=> ($priority_order[$b['queuePriorityState']] ?? 99);
    });

    return [
        'generatedAt' => gmdate('c'),
        'releaseCalendarState' => 'active',
        'publishQueueState' => [
            'total' => count($publish_queue),
            'critical' => count(array_filter($publish_queue, static fn ($item) => ($item['queuePriorityState'] ?? '') === 'critical')),
            'blocked' => count(array_filter($publish_queue, static fn ($item) => ($item['blockedState'] ?? '') !== 'not_blocked')),
            'overdue' => count(array_filter($publish_queue, static fn ($item) => ($item['overdueState'] ?? '') === 'overdue')),
        ],
        'publishWindowState' => 'open',
        'freezeWindowState' => 'not_set',
        'releaseReadinessChecklist' => [
            'dependency_check',
            'locale_check',
            'membership_access_check',
            'preview_diff_check',
            'revalidation_check',
        ],
        'calendar' => array_values($calendar),
        'publishQueue' => array_slice($publish_queue, 0, 200),
    ];
}

function creava_ops_build_workflow_automation_payload(WP_REST_Request $request): array {
    $dashboard = creava_ops_build_editorial_dashboard_payload($request);
    $automation_items = [];
    $escalation = [
        'none' => 0,
        'reminder_sent' => 0,
        'escalated_to_reviewer' => 0,
        'escalated_to_publisher' => 0,
        'escalated_to_admin' => 0,
        'suppressed' => 0,
    ];

    foreach ($dashboard['queueItems'] as $item) {
        $sla = (string) ($item['editorialSlaState'] ?? 'on_track');
        $reminder_type = 'none';
        if ($sla === 'at_risk') $reminder_type = 'publish_readiness_reminder';
        if ($sla === 'overdue') $reminder_type = 'review_pending_reminder';
        if (($item['publishReadinessState'] ?? '') === 'blocked_by_locale') $reminder_type = 'locale_incomplete_reminder';
        if (($item['publishReadinessState'] ?? '') === 'blocked_by_seo') $reminder_type = 'seo_warning_reminder';
        if (($item['publishReadinessState'] ?? '') === 'blocked_by_media') $reminder_type = 'media_warning_reminder';

        $escalation_state = (string) ($item['escalationState'] ?? 'none');
        if ($escalation_state === 'escalated_to_reviewer' && ($item['queuePriorityState'] ?? '') === 'critical') {
            $escalation_state = 'escalated_to_publisher';
        }

        $escalation[$escalation_state] = ($escalation[$escalation_state] ?? 0) + 1;
        $automation_items[] = [
            'postId' => $item['id'] ?? null,
            'title' => $item['title'] ?? '',
            'queuePriorityState' => $item['queuePriorityState'] ?? 'low',
            'editorialSlaState' => $sla,
            'assignmentState' => $item['assignmentState'] ?? 'unassigned',
            'suggestedAssignee' => $item['ownerLabel'] ?? '',
            'reminderState' => $reminder_type === 'none' ? 'none' : 'scheduled',
            'reminderType' => $reminder_type,
            'escalationState' => $escalation_state,
            'guardedAutomationState' => 'suggestion_only',
            'queueReprioritizationState' => in_array($sla, ['overdue', 'blocked'], true) ? 'recommended' : 'optional',
            'muteState' => 'available',
            'snoozeState' => 'available',
        ];
    }

    return [
        'generatedAt' => gmdate('c'),
        'workflowAutomationState' => 'active',
        'guardedAutomationPolicy' => [
            'autoAssignDefault' => 'disabled',
            'autoPublishDefault' => 'disabled',
            'autoMergeDefault' => 'disabled',
            'assignmentAssistMode' => 'suggestion_only',
        ],
        'reminderState' => [
            'scheduledCount' => count(array_filter($automation_items, static fn ($item) => ($item['reminderState'] ?? '') === 'scheduled')),
            'noneCount' => count(array_filter($automation_items, static fn ($item) => ($item['reminderState'] ?? '') === 'none')),
        ],
        'escalationState' => $escalation,
        'dailyDigestState' => 'ready',
        'weeklyOpsSummaryState' => 'ready',
        'items' => array_slice($automation_items, 0, 200),
    ];
}

function creava_ops_build_workload_balancing_payload(WP_REST_Request $request): array {
    $dashboard = creava_ops_build_editorial_dashboard_payload($request);
    $release = creava_ops_build_release_calendar_payload($request);
    $owners = is_array($dashboard['operatorLoadState'] ?? null) ? $dashboard['operatorLoadState'] : [];

    return [
        'generatedAt' => gmdate('c'),
        'operatorLoadState' => [
            'balancedCount' => count(array_filter($owners, static fn ($owner) => ($owner['operatorLoadState'] ?? '') === 'balanced')),
            'overloadedCount' => count(array_filter($owners, static fn ($owner) => ($owner['operatorLoadState'] ?? '') === 'overloaded')),
            'underutilizedCount' => count(array_filter($owners, static fn ($owner) => ($owner['operatorLoadState'] ?? '') === 'underutilized')),
            'blockedByDependencyCount' => count(array_filter($owners, static fn ($owner) => ($owner['operatorLoadState'] ?? '') === 'blocked_by_dependency')),
        ],
        'reviewCadenceState' => $dashboard['reviewCadenceState'] ?? ['dailyReviewQueueCount' => 0, 'weeklyReviewQueueCount' => 0],
        'queueBacklogState' => [
            'delayedQueueCount' => (int) (($release['publishQueueState']['overdue'] ?? 0)),
            'blockedQueueCount' => (int) (($release['publishQueueState']['blocked'] ?? 0)),
            'criticalQueueCount' => (int) (($release['publishQueueState']['critical'] ?? 0)),
        ],
        'opsReportingState' => [
            'weeklyReviewReportState' => 'ready',
            'monthlyReviewReportState' => 'ready',
            'publishThroughputState' => 'measurable',
            'reviewLatencyState' => 'measurable',
            'fixLatencyState' => 'measurable',
        ],
        'owners' => $owners,
        'kpi' => [
            'publishThroughput' => (int) (($dashboard['editorialQueueState']['ready_to_publish_queue'] ?? 0)),
            'reviewLatencyRisk' => (int) (($dashboard['editorialSlaState']['waiting_review'] ?? 0)),
            'fixLatencyRisk' => (int) (($dashboard['editorialSlaState']['blocked'] ?? 0)),
        ],
    ];
}

function creava_ops_build_planning_bottleneck_payload(WP_REST_Request $request): array {
    $dashboard = creava_ops_build_editorial_dashboard_payload($request);
    $release = creava_ops_build_release_calendar_payload($request);

    $queue = $dashboard['editorialQueueState'] ?? [];
    $sla = $dashboard['editorialSlaState'] ?? [];
    $blocked = $dashboard['blockedState'] ?? [];

    return [
        'generatedAt' => gmdate('c'),
        'planningBottleneckState' => 'visible',
        'summary' => [
            'dependencyBottleneckCount' => (int) ($queue['dependency_warning_queue'] ?? 0),
            'localeRolloutBottleneckCount' => (int) ($queue['locale_incomplete_queue'] ?? 0),
            'reviewBacklogCount' => (int) ($sla['waiting_review'] ?? 0),
            'publishDelayCount' => (int) ($release['publishQueueState']['overdue'] ?? 0),
            'blockedLaunchCount' => (int) ($blocked['blockedCount'] ?? 0),
        ],
        'bottleneckAreas' => [
            [
                'area' => 'campaign_planning',
                'blockingState' => ($queue['dependency_warning_queue'] ?? 0) > 0 ? 'waiting_dependency' : 'healthy',
                'description' => 'taxonomy / featured / membership dependency の整理不足で公開順序判断が遅延',
            ],
            [
                'area' => 'locale_rollout',
                'blockingState' => ($queue['locale_incomplete_queue'] ?? 0) > 0 ? 'missing_locale' : 'healthy',
                'description' => 'locale 別 rollout 差分が queue から即時判断しづらい',
            ],
            [
                'area' => 'approval_flow',
                'blockingState' => ($sla['waiting_review'] ?? 0) > 0 ? 'review_backlog' : 'healthy',
                'description' => 'review / approval の手戻り理由が分散し launch 判断が遅れる',
            ],
            [
                'area' => 'launch_safety',
                'blockingState' => ($release['publishQueueState']['blocked'] ?? 0) > 0 ? 'blocked_launch_detected' : 'healthy',
                'description' => 'calendar と publish risk の突合が手作業化しやすい',
            ],
        ],
        'nextActions' => [
            'cross-site campaign workspace で依存関係付き公開順序を先に固定',
            'release simulation で locale / cache / search / membership 影響を同時確認',
            'SLA prediction と workload forecast の週次レビューを運用化',
        ],
        'opsTraceId' => wp_generate_uuid4(),
        'opsUpdatedAt' => gmdate('c'),
    ];
}

function creava_ops_build_campaign_orchestration_payload(WP_REST_Request $request): array {
    $dashboard = creava_ops_build_editorial_dashboard_payload($request);
    $release = creava_ops_build_release_calendar_payload($request);
    $dependency = creava_ops_build_dependency_graph_payload($request);
    $queue_items = is_array($dashboard['queueItems'] ?? null) ? $dashboard['queueItems'] : [];
    $calendar = is_array($release['calendar'] ?? null) ? $release['calendar'] : [];

    $campaign_groups = [];
    foreach ($queue_items as $item) {
        $site = (string) ($item['sourceSite'] ?? 'main');
        $locale = (string) ($item['locale'] ?? 'ja');
        $key = sprintf('%s:%s', $site, $locale);
        if (!isset($campaign_groups[$key])) {
            $campaign_groups[$key] = [
                'campaignId' => 'campaign-' . md5($key),
                'campaignName' => sprintf('%s rollout (%s)', strtoupper($site), $locale),
                'crossSiteCampaignState' => 'active',
                'campaignOrchestrationState' => 'planning',
                'sourceSite' => $site,
                'locale' => $locale,
                'contentCount' => 0,
                'dependencyCount' => 0,
                'publishRiskScoreState' => 'low',
                'releaseWindowState' => 'draft',
                'opsTraceId' => wp_generate_uuid4(),
            ];
        }

        $campaign_groups[$key]['contentCount'] += 1;
        $campaign_groups[$key]['dependencyCount'] += (int) ($item['dependencyCount'] ?? 0);
        if (($item['publishRiskState'] ?? 'low') === 'high') {
            $campaign_groups[$key]['publishRiskScoreState'] = 'high';
        } elseif (($item['publishRiskState'] ?? 'low') === 'medium' && $campaign_groups[$key]['publishRiskScoreState'] === 'low') {
            $campaign_groups[$key]['publishRiskScoreState'] = 'medium';
        }
    }

    $locale_rollout = [];
    foreach ($calendar as $day) {
        $items = is_array($day['items'] ?? null) ? $day['items'] : [];
        foreach ($items as $item) {
            $locale = (string) ($item['locale'] ?? 'ja');
            if (!isset($locale_rollout[$locale])) {
                $locale_rollout[$locale] = [
                    'locale' => $locale,
                    'plannedCount' => 0,
                    'blockedCount' => 0,
                    'campaignOrchestrationState' => 'planning',
                ];
            }
            $locale_rollout[$locale]['plannedCount'] += 1;
            if (($item['releaseRiskState'] ?? 'healthy') !== 'healthy') {
                $locale_rollout[$locale]['blockedCount'] += 1;
                $locale_rollout[$locale]['campaignOrchestrationState'] = 'waiting_dependency';
            }
        }
    }

    return [
        'generatedAt' => gmdate('c'),
        'campaignOrchestrationState' => 'planning',
        'crossSiteCampaignState' => 'active',
        'releaseWindowState' => 'planning',
        'dependencyForecastState' => ($dependency['impactSummary']['publishRiskImpactCount'] ?? 0) > 0 ? 'risk_detected' : 'healthy',
        'impactForecastState' => 'ready',
        'campaigns' => array_values($campaign_groups),
        'localeRolloutPlan' => array_values($locale_rollout),
        'impactPreview' => [
            'dependencyImpactCount' => (int) ($dependency['impactSummary']['publishRiskImpactCount'] ?? 0),
            'searchImpactCount' => (int) ($dependency['impactSummary']['searchImpactCount'] ?? 0),
            'membershipImpactCount' => (int) ($dependency['impactSummary']['membershipImpactCount'] ?? 0),
            'localeImpactCount' => (int) ($dependency['impactSummary']['localeImpactCount'] ?? 0),
        ],
        'opsTraceId' => wp_generate_uuid4(),
        'opsUpdatedAt' => gmdate('c'),
    ];
}

function creava_ops_build_release_simulation_payload(WP_REST_Request $request): array {
    $dashboard = creava_ops_build_editorial_dashboard_payload($request);
    $release = creava_ops_build_release_calendar_payload($request);
    $dependency = creava_ops_build_dependency_graph_payload($request);
    $queue = is_array($release['publishQueue'] ?? null) ? $release['publishQueue'] : [];
    $top = array_slice($queue, 0, 20);

    $has_blocked = count(array_filter($top, static fn ($item) => (string) ($item['blockedState'] ?? 'not_blocked') !== 'not_blocked')) > 0;
    $has_high = count(array_filter($top, static fn ($item) => (string) ($item['publishRiskState'] ?? 'low') === 'high')) > 0;
    $state = 'simulated';
    if ($has_blocked) {
        $state = 'blocked';
    } elseif ($has_high) {
        $state = 'warning_detected';
    }

    return [
        'generatedAt' => gmdate('c'),
        'releaseSimulationState' => $state,
        'launchChecklistState' => 'generated',
        'dependencyForecastState' => ($dependency['impactSummary']['publishRiskImpactCount'] ?? 0) > 0 ? 'risk_detected' : 'healthy',
        'impactForecastState' => $has_high ? 'warning' : 'normal',
        'simulationScope' => [
            'siteCount' => 3,
            'queueCount' => count($queue),
            'simulatedCount' => count($top),
        ],
        'impactPreview' => [
            'dependencyImpact' => (int) ($dependency['impactSummary']['publishRiskImpactCount'] ?? 0),
            'localeImpact' => (int) ($dependency['impactSummary']['localeImpactCount'] ?? 0),
            'cacheImpact' => count($top),
            'searchImpact' => (int) ($dependency['impactSummary']['searchImpactCount'] ?? 0),
            'membershipImpact' => (int) ($dependency['impactSummary']['membershipImpactCount'] ?? 0),
            'workloadImpact' => (int) (($dashboard['blockedState']['blockedCount'] ?? 0) + ($dashboard['editorialSlaState']['at_risk'] ?? 0)),
            'slaRisk' => (int) ($dashboard['editorialSlaState']['at_risk'] ?? 0),
        ],
        'missingPrerequisites' => array_values(array_map(static function (array $item): array {
            return [
                'id' => $item['id'] ?? null,
                'title' => $item['title'] ?? '',
                'site' => $item['site'] ?? 'main',
                'reason' => ($item['finalCheckState'] ?? 'ready') === 'ready' ? 'none' : 'preview_or_dependency_check_required',
                'blockedState' => $item['blockedState'] ?? 'not_blocked',
            ];
        }, array_filter($top, static fn ($item) => (string) ($item['finalCheckState'] ?? 'ready') !== 'ready'))),
        'launchChecklist' => [
            'dependency graph と publish queue の差分確認',
            'locale rollout / slug / taxonomy の整合確認',
            'preview と live の差分確認',
            'revalidation / cache invalidation の対象確認',
            'search / notification / membership 影響確認',
        ],
        'opsTraceId' => wp_generate_uuid4(),
        'opsUpdatedAt' => gmdate('c'),
    ];
}

function creava_ops_build_planning_intelligence_payload(WP_REST_Request $request): array {
    $dashboard = creava_ops_build_editorial_dashboard_payload($request);
    $workload = creava_ops_build_workload_balancing_payload($request);
    $release = creava_ops_build_release_calendar_payload($request);

    $at_risk = (int) ($dashboard['editorialSlaState']['at_risk'] ?? 0);
    $overdue = (int) ($dashboard['editorialSlaState']['overdue'] ?? 0);
    $blocked = (int) ($release['publishQueueState']['blocked'] ?? 0);
    $critical = (int) ($release['publishQueueState']['critical'] ?? 0);
    $risk_score = $critical * 3 + $blocked * 2 + $at_risk + $overdue * 2;

    $risk_state = 'low';
    if ($risk_score >= 25) $risk_state = 'critical';
    elseif ($risk_score >= 14) $risk_state = 'high';
    elseif ($risk_score >= 6) $risk_state = 'medium';

    $sla_state = 'on_track';
    if ($blocked > 0) $sla_state = 'blocked_by_dependency';
    elseif (($workload['operatorLoadState']['overloadedCount'] ?? 0) > 0) $sla_state = 'blocked_by_capacity';
    elseif ($overdue > 0) $sla_state = 'likely_overdue';
    elseif ($at_risk > 0) $sla_state = 'at_risk';

    $workload_state = ($workload['operatorLoadState']['overloadedCount'] ?? 0) > 0 ? 'high' : 'balanced';

    return [
        'generatedAt' => gmdate('c'),
        'editorialPlanningIntelligenceState' => 'active',
        'slaPredictionState' => $sla_state,
        'publishRiskScoreState' => $risk_state,
        'workloadForecastState' => $workload_state,
        'readinessForecastState' => $blocked > 0 ? 'needs_intervention' : 'ready_for_review',
        'escalationForecastState' => $risk_state === 'critical' ? 'escalate_now' : ($risk_state === 'high' ? 'escalate_if_no_progress_24h' : 'monitor'),
        'slaPrediction' => [
            'atRiskCount' => $at_risk,
            'likelyOverdueCount' => $overdue,
            'blockedByDependencyCount' => $blocked,
            'blockedByCapacityCount' => (int) ($workload['operatorLoadState']['overloadedCount'] ?? 0),
        ],
        'publishRiskScore' => [
            'score' => $risk_score,
            'state' => $risk_state,
            'explanations' => [
                sprintf('critical queue: %d', $critical),
                sprintf('blocked queue: %d', $blocked),
                sprintf('sla at risk: %d', $at_risk),
            ],
            'manualReviewRequired' => in_array($risk_state, ['high', 'critical'], true),
        ],
        'workloadForecast' => [
            'overloadedOwners' => (int) ($workload['operatorLoadState']['overloadedCount'] ?? 0),
            'blockedByDependencyOwners' => (int) ($workload['operatorLoadState']['blockedByDependencyCount'] ?? 0),
            'dailyReviewQueueCount' => (int) ($workload['reviewCadenceState']['dailyReviewQueueCount'] ?? 0),
            'weeklyReviewQueueCount' => (int) ($workload['reviewCadenceState']['weeklyReviewQueueCount'] ?? 0),
        ],
        'manualOverrideState' => 'available',
        'opsTraceId' => wp_generate_uuid4(),
        'opsUpdatedAt' => gmdate('c'),
    ];
}

function creava_ops_build_operator_copilot_payload(WP_REST_Request $request): array {
    $campaign = creava_ops_build_campaign_orchestration_payload($request);
    $simulation = creava_ops_build_release_simulation_payload($request);
    $planning = creava_ops_build_planning_intelligence_payload($request);

    $warnings = [];
    if (($simulation['releaseSimulationState'] ?? 'simulated') === 'blocked') {
        $warnings[] = 'blocked dependency があるため launch 前に依存解消が必要';
    }
    if (in_array(($planning['publishRiskScoreState'] ?? 'low'), ['high', 'critical'], true)) {
        $warnings[] = 'publish risk が高いため reviewer / publisher に escalation を推奨';
    }

    return [
        'generatedAt' => gmdate('c'),
        'operatorCopilotState' => empty($warnings) ? 'ready_for_review' : 'warning',
        'approvalAssistState' => 'ready_for_review',
        'planningSummaryState' => 'generated',
        'launchChecklistState' => (string) ($simulation['launchChecklistState'] ?? 'generated'),
        'campaignSummary' => [
            'campaignOrchestrationState' => $campaign['campaignOrchestrationState'] ?? 'planning',
            'crossSiteCampaignState' => $campaign['crossSiteCampaignState'] ?? 'active',
            'campaignCount' => count($campaign['campaigns'] ?? []),
        ],
        'dependencySummary' => [
            'dependencyForecastState' => $simulation['dependencyForecastState'] ?? 'healthy',
            'missingPrerequisiteCount' => count($simulation['missingPrerequisites'] ?? []),
        ],
        'approvalAssist' => [
            'manualApprovalRequired' => in_array(($planning['publishRiskScoreState'] ?? 'low'), ['high', 'critical'], true),
            'reviewerSuggestion' => 'release simulation と launch checklist を比較し、差分理由を記録',
            'publisherSuggestion' => 'preview/live 差分と revalidation 対象を最終確認',
            'operatorSuggestion' => 'blocked queue を先に解消し、campaign 単位で公開順序を再計算',
        ],
        'copilotSuggestions' => [
            'suggest' => 'high-risk campaign は locale rollout を分割して公開',
            'compare' => 'predicted SLA と actual backlog の差分を weekly review で確認',
            'summarize' => 'campaign / release / workload の要点を日次 digest 化',
            'warn' => empty($warnings) ? '重大な警告なし' : implode(' / ', $warnings),
            'propose' => 'launch checklist の不足項目を補完して approval に添付',
            'prepare' => 'reviewer / publisher 向け承認メモを自動下書き',
        ],
        'guardrailPolicy' => [
            'autoPublishDefault' => 'disabled',
            'autoAssignDefault' => 'disabled',
            'riskOverrideDefault' => 'manual_review_required',
            'suppressionState' => 'available',
            'muteState' => 'available',
            'snoozeState' => 'available',
        ],
        'opsTraceId' => wp_generate_uuid4(),
        'opsUpdatedAt' => gmdate('c'),
    ];
}

function creava_ops_build_planning_review_payload(WP_REST_Request $request): array {
    $planning = creava_ops_build_planning_intelligence_payload($request);
    $simulation = creava_ops_build_release_simulation_payload($request);

    return [
        'generatedAt' => gmdate('c'),
        'planningReviewCadenceState' => 'active',
        'weeklyPlanningReviewTemplate' => [
            'predicted_vs_actual_sla_diff',
            'blocked_dependency_resolution_progress',
            'locale_rollout_slip_review',
            'operator_workload_imbalance_review',
            'high_risk_launch_followup',
        ],
        'launchReadinessReviewTemplate' => [
            'simulation_result_review',
            'launch_checklist_completion',
            'approval_assist_notes',
            'revalidation_cache_scope_confirmation',
        ],
        'monthlyCampaignRetrospectiveTemplate' => [
            'campaign_throughput_vs_quality',
            'approval_latency_trend',
            'dependency_failure_pattern',
            'prediction_precision_review',
            'runbook_update_actions',
        ],
        'reportingSummary' => [
            'predictedSlaState' => $planning['slaPredictionState'] ?? 'on_track',
            'predictedRiskState' => $planning['publishRiskScoreState'] ?? 'low',
            'simulationState' => $simulation['releaseSimulationState'] ?? 'simulated',
        ],
        'ownership' => [
            'editorialPlanningOwner' => 'editorial-ops',
            'campaignOrchestrationOwner' => 'release-ops',
            'simulationOwner' => 'release-ops',
            'predictionOwner' => 'ops-analytics',
            'copilotOwner' => 'operator-enable',
        ],
        'opsTraceId' => wp_generate_uuid4(),
        'opsUpdatedAt' => gmdate('c'),
    ];
}

function creava_ops_build_growth_outcome_payload(WP_REST_Request $request): array {
    $campaign = creava_ops_build_campaign_orchestration_payload($request);
    $simulation = creava_ops_build_release_simulation_payload($request);
    $planning = creava_ops_build_planning_intelligence_payload($request);
    $review = creava_ops_build_planning_review_payload($request);

    $campaigns = is_array($campaign['campaigns'] ?? null) ? $campaign['campaigns'] : [];
    $locale_rollout = is_array($campaign['localeRolloutPlan'] ?? null) ? $campaign['localeRolloutPlan'] : [];
    $impact_preview = is_array($campaign['impactPreview'] ?? null) ? $campaign['impactPreview'] : [];

    $low_signal_count = count(array_filter($campaigns, static fn ($item) => ((int) ($item['contentCount'] ?? 0)) < 2));
    $high_risk_count = count(array_filter($campaigns, static fn ($item) => ($item['publishRiskScoreState'] ?? '') === 'high'));
    $blocked_locale_count = count(array_filter($locale_rollout, static fn ($item) => ($item['campaignOrchestrationState'] ?? '') === 'waiting_dependency'));

    $campaign_roi_state = 'mixed';
    if (count($campaigns) === 0) {
        $campaign_roi_state = 'not_evaluated';
    } elseif ($high_risk_count === 0 && $low_signal_count === 0) {
        $campaign_roi_state = 'positive';
    } elseif ($low_signal_count >= count($campaigns)) {
        $campaign_roi_state = 'low_signal';
    }

    $prioritization_score = count($campaigns) * 20 - $high_risk_count * 15 - $blocked_locale_count * 10;
    $channel_contribution_state = ((int) ($impact_preview['searchImpactCount'] ?? 0)) > 0 ? 'moderate' : 'unknown';
    if (($impact_preview['membershipImpactCount'] ?? 0) > ($impact_preview['searchImpactCount'] ?? 0) * 2 && ($impact_preview['membershipImpactCount'] ?? 0) > 0) {
        $channel_contribution_state = 'disproportionate';
    }

    return [
        'generatedAt' => gmdate('c'),
        'campaignRoiState' => $campaign_roi_state,
        'postLaunchAttributionState' => $low_signal_count > 0 ? 'partial' : ($high_risk_count > 0 ? 'needs_review' : 'stable'),
        'channelContributionState' => $channel_contribution_state,
        'contentRoiState' => ($impact_preview['dependencyImpactCount'] ?? 0) > 0 ? 'needs_refresh' : 'healthy',
        'experimentFeedbackState' => in_array(($planning['publishRiskScoreState'] ?? 'low'), ['high', 'critical'], true) ? 'inconclusive' : 'linked',
        'launchOutcomeState' => ($simulation['releaseSimulationState'] ?? 'simulated') === 'blocked' ? 'mixed' : 'positive',
        'learningLoopState' => $review['planningReviewCadenceState'] ?? 'active',
        'budgetImpactState' => $high_risk_count > 0 ? 'review_needed' : 'within_budget',
        'prioritizationScoreState' => $prioritization_score >= 80 ? 'high_priority' : ($prioritization_score >= 40 ? 'medium_priority' : 'manual_review_required'),
        'nextBestActionState' => $high_risk_count > 0 ? 'review_blocked_locale_rollout' : 'promote_high_leverage_campaign',
        'growthReviewState' => 'ready',
        'retroState' => 'ready',
        'releaseOutcomeState' => $simulation['releaseSimulationState'] ?? 'simulated',
        'forecastConfidenceState' => $high_risk_count > 0 ? 'low' : 'medium',
        'summary' => [
            'campaignCount' => count($campaigns),
            'highRiskCount' => $high_risk_count,
            'lowSignalCount' => $low_signal_count,
            'blockedLocaleCount' => $blocked_locale_count,
            'dependencyImpactCount' => (int) ($impact_preview['dependencyImpactCount'] ?? 0),
            'searchImpactCount' => (int) ($impact_preview['searchImpactCount'] ?? 0),
            'membershipImpactCount' => (int) ($impact_preview['membershipImpactCount'] ?? 0),
        ],
        'reviewTemplates' => [
            'weeklyLaunchOutcomeReview' => $review['weeklyPlanningReviewTemplate'] ?? [],
            'weeklyPrioritizationReview' => [
                'score と final decision を混同しない',
                'budget / effort / risk / dependency を同時確認',
                'manual override rationale を記録',
            ],
            'monthlyCampaignRetro' => $review['monthlyCampaignRetrospectiveTemplate'] ?? [],
        ],
        'opsTraceId' => wp_generate_uuid4(),
        'opsUpdatedAt' => gmdate('c'),
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

    register_rest_route('creava/v1', '/ops/dependency-graph', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_dependency_graph_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/release-calendar', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_release_calendar_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/workflow-automation', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_workflow_automation_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/workload-balancing', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_workload_balancing_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/planning-bottlenecks', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_planning_bottleneck_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/campaign-orchestration', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_campaign_orchestration_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/release-simulation', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_release_simulation_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/planning-intelligence', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_planning_intelligence_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/operator-copilot', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_operator_copilot_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/planning-review', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_planning_review_payload($request));
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('creava/v1', '/ops/growth-outcome', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            if (!creava_ops_can_access_dashboard($request)) {
                return new WP_REST_Response(['error' => 'forbidden'], 403);
            }

            return rest_ensure_response(creava_ops_build_growth_outcome_payload($request));
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
    $dependency = creava_ops_build_dependency_graph_payload($request);
    $release = creava_ops_build_release_calendar_payload($request);
    $automation = creava_ops_build_workflow_automation_payload($request);
    $workload = creava_ops_build_workload_balancing_payload($request);
    $bottlenecks = creava_ops_build_planning_bottleneck_payload($request);
    $campaign = creava_ops_build_campaign_orchestration_payload($request);
    $simulation = creava_ops_build_release_simulation_payload($request);
    $planning = creava_ops_build_planning_intelligence_payload($request);
    $copilot = creava_ops_build_operator_copilot_payload($request);
    $review = creava_ops_build_planning_review_payload($request);
    $growth = creava_ops_build_growth_outcome_payload($request);

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

    echo '<h2>6) Editorial SLA / Queue Priority / Workload</h2>';
    echo '<p>SLA と priority は別管理です。overdue/blocked と overloaded owner を分離して確認してください。</p>';
    echo '<pre>' . esc_html(wp_json_encode([
        'editorialSlaState' => $dashboard['editorialSlaState'] ?? [],
        'queuePriorityState' => $dashboard['queuePriorityState'] ?? [],
        'operatorLoadState' => $dashboard['operatorLoadState'] ?? [],
        'escalationState' => $dashboard['escalationState'] ?? [],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<h2>7) Cross-site Dependency Graph / Impact Preview</h2>';
    echo '<p>content → taxonomy / membership / asset dependency と publish / locale / revalidation 影響を確認します。</p>';
    echo '<pre>' . esc_html(wp_json_encode([
        'impactSummary' => $dependency['impactSummary'] ?? [],
        'dependencySeverityState' => $dependency['dependencySeverityState'] ?? [],
        'publishImpactPreview' => array_slice($dependency['publishImpactPreview'] ?? [], 0, 8),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<h2>8) Release Calendar / Publish Queue</h2>';
    echo '<p>calendar で公開計画、queue で実務優先度を判断します。公開後 verification は必須です。</p>';
    echo '<pre>' . esc_html(wp_json_encode([
        'publishQueueState' => $release['publishQueueState'] ?? [],
        'releaseReadinessChecklist' => $release['releaseReadinessChecklist'] ?? [],
        'calendarSample' => array_slice($release['calendar'] ?? [], 0, 3),
        'publishQueueSample' => array_slice($release['publishQueue'] ?? [], 0, 8),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<h2>9) Workflow Automation / Reminder / Escalation</h2>';
    echo '<p>suggestion/queue/reminder/escalation を基本とし、destructive automation は既定で無効化しています。</p>';
    echo '<pre>' . esc_html(wp_json_encode([
        'guardedAutomationPolicy' => $automation['guardedAutomationPolicy'] ?? [],
        'reminderState' => $automation['reminderState'] ?? [],
        'escalationState' => $automation['escalationState'] ?? [],
        'itemsSample' => array_slice($automation['items'] ?? [], 0, 8),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<h2>10) Workload Balancing / Review Cadence / Ops Reporting</h2>';
    echo '<pre>' . esc_html(wp_json_encode($workload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<h2>11) Planning bottlenecks / campaign orchestration / release simulation</h2>';
    echo '<p>planning可視化と公開判断を混同しないため、詰まり・計画・simulationを分離して表示します。</p>';
    echo '<pre>' . esc_html(wp_json_encode([
        'planningBottlenecks' => $bottlenecks,
        'campaignOrchestration' => $campaign,
        'releaseSimulation' => $simulation,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<h2>12) Planning intelligence / operator copilot / approval assist / review cadence</h2>';
    echo '<p>copilot は suggestion / compare / summarize / warn / propose / prepare を基本とし、auto publish は無効を維持します。</p>';
    echo '<pre>' . esc_html(wp_json_encode([
        'planningIntelligence' => $planning,
        'operatorCopilot' => $copilot,
        'planningReview' => $review,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

    echo '<h2>13) Post-launch growth outcome / ROI / attribution / prioritization</h2>';
    echo '<p>campaign ROI と attribution と prioritization は同義ではありません。state を分離して weekly / monthly review に渡します。</p>';
    echo '<pre>' . esc_html(wp_json_encode($growth, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';

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
