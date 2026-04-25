<?php
if (!defined('ABSPATH')) { exit; }

function creava_get_post_type_definitions(): array {
    return [
        'blog' => ['label' => 'ブログ', 'rewrite' => 'blog', 'site' => 'main'],
        'news' => ['label' => 'ニュース', 'rewrite' => 'news', 'site' => 'main'],
        'event' => ['label' => 'イベント', 'rewrite' => 'events', 'site' => 'main'],
        'work' => ['label' => '作品', 'rewrite' => 'works', 'site' => 'main'],
        'store_product' => ['label' => '商品', 'rewrite' => 'store/products', 'site' => 'store'],
        'fanclub_content' => ['label' => 'ファンクラブ', 'rewrite' => 'fanclub/content', 'site' => 'fc'],
        'creava_order' => ['label' => '注文'],
        'creava_subscription' => ['label' => 'サブスクリプション'],
        'creava_entitlement' => ['label' => '権利'],
        'creava_customer' => ['label' => '顧客'],
    ];
}

function creava_register_post_types(): void {
    $types = creava_get_post_type_definitions();

    foreach ($types as $slug => $config) {
        $label = (string) ($config['label'] ?? $slug);
        $is_public_type = !str_starts_with($slug, 'creava_');
        $rewrite_slug = sanitize_title_with_dashes((string) ($config['rewrite'] ?? $slug));
        $site = sanitize_key((string) ($config['site'] ?? 'main'));

        register_post_type($slug, [
            'label' => $label,
            'public' => $is_public_type,
            'publicly_queryable' => $is_public_type,
            'exclude_from_search' => !$is_public_type,
            'has_archive' => $is_public_type,
            'query_var' => $is_public_type ? $slug : false,
            'rewrite' => $is_public_type ? [
                'slug' => $rewrite_slug,
                'with_front' => false,
                'feeds' => false,
                'pages' => true,
            ] : false,
            'show_in_rest' => true,
            'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
            'map_meta_cap' => true,
            'menu_icon' => $is_public_type ? 'dashicons-admin-post' : 'dashicons-database',
            'labels' => [
                'name' => $label,
                'singular_name' => $label,
                'menu_name' => $label,
            ],
            'description' => $is_public_type
                ? sprintf('Creava public content (%s site).', strtoupper($site))
                : 'Creava private operational data.',
        ]);
    }
}
add_action('init', 'creava_register_post_types');
