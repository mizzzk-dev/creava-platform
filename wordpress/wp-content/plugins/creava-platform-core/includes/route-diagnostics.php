<?php
if (!defined('ABSPATH')) { exit; }

function creava_get_reserved_route_slugs(): array {
    return [
        'about', 'blog', 'news', 'events', 'works', 'store', 'fanclub', 'contact',
        'member', 'preview', 'support', 'status', 'discover', 'legal', 'callback',
        'products', 'collections', 'campaigns', 'guide', 'login', 'join',
    ];
}

function creava_collect_route_resolution_state(string $post_type, string $slug): array {
    $slug = sanitize_title($slug);
    if ($slug === '') {
        return [
            'postType' => $post_type,
            'slug' => '',
            'wordpressRouteResolutionState' => 'not_requested',
        ];
    }

    $resolved = get_page_by_path($slug, OBJECT, $post_type);
    $found = $resolved instanceof WP_Post;
    $status = $found ? (string) $resolved->post_status : 'missing';
    $permalink = $found ? (string) get_permalink($resolved) : '';

    $conflicts = get_posts([
        'name' => $slug,
        'post_type' => 'any',
        'post_status' => ['publish', 'draft', 'pending', 'private', 'future'],
        'posts_per_page' => 10,
        'fields' => 'ids',
    ]);

    return [
        'postType' => $post_type,
        'slug' => $slug,
        'found' => $found,
        'postId' => $found ? (int) $resolved->ID : null,
        'postStatus' => $status,
        'permalink' => $permalink,
        'postTypeMatch' => $found && $resolved->post_type === $post_type,
        'slugConflictCount' => is_array($conflicts) ? count($conflicts) : 0,
        'slugConflictRisk' => is_array($conflicts) && count($conflicts) > 1 ? 'detected' : 'none',
        'reservedPathConflictRisk' => in_array($slug, creava_get_reserved_route_slugs(), true) ? 'detected' : 'none',
        'wordpressRouteResolutionState' => $found ? 'resolved' : 'not_found',
        'wordpressRouteVerifiedAt' => gmdate('c'),
    ];
}

function creava_collect_rewrite_health_state(): array {
    $home_url = (string) home_url('/');
    $site_url = (string) site_url('/');
    $permalink_structure = (string) get_option('permalink_structure', '');
    $rewrite_rules = get_option('rewrite_rules');
    $has_rewrite_rules = is_array($rewrite_rules) && !empty($rewrite_rules);

    $show_on_front = (string) get_option('show_on_front', 'posts');
    $page_on_front = (int) get_option('page_on_front', 0);
    $page_for_posts = (int) get_option('page_for_posts', 0);

    return [
        'wordpressPermalinkState' => $permalink_structure === '' ? 'plain_permalink' : 'pretty_permalink',
        'wordpressPermalinkStructure' => $permalink_structure,
        'wordpressRewriteState' => $has_rewrite_rules ? 'present' : 'missing',
        'wordpressRewriteRuleCount' => $has_rewrite_rules ? count($rewrite_rules) : 0,
        'wordpressSiteUrlState' => untrailingslashit($home_url) === untrailingslashit($site_url) ? 'aligned' : 'mismatch',
        'wordpressHomeUrl' => $home_url,
        'wordpressSiteUrl' => $site_url,
        'wordpressFrontPageState' => $show_on_front,
        'wordpressPageOnFront' => $page_on_front,
        'wordpressPostsPage' => $page_for_posts,
        'wordpressCanonicalState' => 'requires_runtime_verification',
        'wordpressRouteVerifiedAt' => gmdate('c'),
    ];
}

function creava_register_route_diagnostics_routes(): void {
    register_rest_route('creava/v1', '/ops/route-diagnostics', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => static function (WP_REST_Request $request) {
            $security_validation = creava_security_validate_public_rest_request($request, 'route_diagnostics');
            if ($security_validation instanceof WP_REST_Response) {
                return $security_validation;
            }

            $trace_id = wp_generate_uuid4();
            $page_slug = sanitize_title((string) $request->get_param('pageSlug'));
            $post_slug = sanitize_title((string) $request->get_param('postSlug'));
            $locale = creava_get_locale_from_request($request);

            $rewrite_state = creava_collect_rewrite_health_state();
            $page_state = creava_collect_route_resolution_state('page', $page_slug);
            $post_state = creava_collect_route_resolution_state('post', $post_slug);

            return rest_ensure_response([
                'generatedAt' => gmdate('c'),
                'opsTraceId' => $trace_id,
                'wordpressTraceId' => $trace_id,
                'wordpressLocaleState' => $locale,
                'wordpressRouteDiagnosticsState' => 'ready',
                'rewrite' => $rewrite_state,
                'pageResolution' => $page_state,
                'postResolution' => $post_state,
                'hypothesis' => [
                    'wp_rewrite_issue' => $rewrite_state['wordpressRewriteState'] !== 'present',
                    'wp_permalink_issue' => $rewrite_state['wordpressPermalinkState'] === 'plain_permalink',
                    'server_rewrite_issue' => $rewrite_state['wordpressPermalinkState'] === 'pretty_permalink' && $rewrite_state['wordpressRewriteState'] === 'present',
                    'slug_conflict_issue' => $page_state['slugConflictRisk'] === 'detected' || $post_state['slugConflictRisk'] === 'detected',
                    'reserved_path_issue' => $page_state['reservedPathConflictRisk'] === 'detected' || $post_state['reservedPathConflictRisk'] === 'detected',
                ],
                'nextActions' => [
                    'pretty permalink + rewrite rule の存在を確認',
                    'pageSlug/postSlug 指定で page/post 解決状態を比較',
                    'preview成功/live404時は frontend route mapping と cache/revalidation を確認',
                    'siteurl/home mismatch や reverse proxy rewrite を確認',
                ],
                'meta' => [
                    'trace' => [
                        ...creava_security_base_state($trace_id),
                        'wordpressTraceId' => $trace_id,
                        'wordpressRouteVerifiedAt' => gmdate('c'),
                    ],
                ],
            ]);
        },
        'permission_callback' => '__return_true',
    ]);
}
