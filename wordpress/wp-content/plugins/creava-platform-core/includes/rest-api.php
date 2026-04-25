<?php
if (!defined('ABSPATH')) { exit; }

add_action('rest_api_init', function () {
    creava_register_content_routes();
    creava_register_stripe_routes();
    creava_register_migration_routes();
    creava_register_editorial_ops_routes();

    register_rest_route('creava/v1', '/stripe/webhook', [
        'methods' => WP_REST_Server::CREATABLE,
        'callback' => 'creava_handle_stripe_webhook',
        'permission_callback' => '__return_true',
    ]);
});
