<?php
/**
 * Plugin Name: Creava Platform Core
 * Description: Creava Platform 向け WordPress CMS/Backend コア実装 (CPT / REST / Stripe)。
 * Version: 0.1.0
 * Author: Creava
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/includes/post-types.php';
require_once __DIR__ . '/includes/taxonomies.php';
require_once __DIR__ . '/includes/meta.php';
require_once __DIR__ . '/includes/orders.php';
require_once __DIR__ . '/includes/subscriptions.php';
require_once __DIR__ . '/includes/entitlements.php';
require_once __DIR__ . '/includes/access-control.php';
require_once __DIR__ . '/includes/security-hardening.php';
require_once __DIR__ . '/includes/editorial-ops.php';
require_once __DIR__ . '/includes/rest-content.php';
require_once __DIR__ . '/includes/rest-migration.php';
require_once __DIR__ . '/includes/rest-stripe.php';
require_once __DIR__ . '/includes/stripe-webhook.php';
require_once __DIR__ . '/includes/rest-api.php';

add_action('plugins_loaded', function () {
    do_action('creava_platform_core_loaded');
});
