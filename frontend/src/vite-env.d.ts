/// <reference types="vite/client" />

interface ImportMetaEnv {
  /* Vite built-ins (augmented here for environments without vite/client types) */
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly BASE_URL: string
  readonly SSR: boolean
  /* App env vars */
  readonly VITE_SITE_TYPE?: 'main' | 'store' | 'fc'
  readonly VITE_SITE_URL?: string
  readonly VITE_MAIN_SITE_URL?: string
  readonly VITE_STORE_SITE_URL?: string
  readonly VITE_FANCLUB_SITE_URL?: string
  readonly VITE_STRAPI_API_URL: string
  readonly VITE_STRAPI_API_TOKEN: string
  readonly VITE_STRAPI_TIMEOUT_MS?: string
  readonly VITE_STRAPI_RETRY_COUNT?: string
  readonly VITE_STRAPI_RESPONSE_CACHE_TTL_MS?: string
  readonly VITE_STRAPI_RESPONSE_CACHE_STALE_TTL_MS?: string
  readonly VITE_STRAPI_USE_TOKEN_FOR_PUBLIC?: string
  readonly VITE_CMS_PROVIDER?: 'strapi' | 'wordpress'
  readonly VITE_WORDPRESS_API_URL?: string
  readonly VITE_CMS_WORDPRESS_ROLLOUT_ENABLED?: string
  readonly VITE_CMS_WORDPRESS_ROLLOUT_SITE_MAIN?: string
  readonly VITE_CMS_WORDPRESS_ROLLOUT_SITE_STORE?: string
  readonly VITE_CMS_WORDPRESS_ROLLOUT_SITE_FC?: string
  readonly VITE_CMS_WORDPRESS_ROLLOUT_BLOG?: string
  readonly VITE_CMS_WORDPRESS_ROLLOUT_NEWS?: string
  readonly VITE_CMS_WORDPRESS_ROLLOUT_EVENTS?: string
  readonly VITE_CMS_WORDPRESS_ROLLOUT_WORKS?: string
  readonly VITE_CMS_WORDPRESS_ROLLOUT_STORE?: string
  readonly VITE_CMS_WORDPRESS_ROLLOUT_FANCLUB?: string
  readonly VITE_CMS_WORDPRESS_ROLLOUT_SETTINGS?: string
  readonly VITE_AUTH_PROVIDER?: 'logto' | 'supabase'
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_OAUTH_DEFAULT_PROVIDER?: string
  readonly VITE_SUPABASE_PROJECT_REF?: string
  readonly VITE_LOGTO_ENDPOINT?: string
  readonly VITE_LOGTO_APP_ID_MAIN?: string
  readonly VITE_LOGTO_APP_ID_STORE?: string
  readonly VITE_LOGTO_APP_ID_FC?: string
  readonly VITE_LOGTO_APP_ID?: string
  readonly VITE_LOGTO_CALLBACK_PATH?: string
  readonly VITE_LOGTO_POST_LOGOUT_REDIRECT_URI?: string
  readonly VITE_LOGTO_API_RESOURCE?: string
  readonly VITE_LOGTO_ISSUER?: string
  readonly VITE_LOGTO_MANAGEMENT_API_ENDPOINT?: string
  readonly VITE_LOGTO_SOCIAL_GOOGLE_ENABLED?: string
  readonly VITE_LOGTO_SOCIAL_APPLE_ENABLED?: string
  readonly VITE_LOGTO_SOCIAL_X_ENABLED?: string
  readonly VITE_LOGTO_SOCIAL_FACEBOOK_ENABLED?: string
  readonly VITE_SHOPIFY_STORE_DOMAIN: string
  readonly VITE_SHOPIFY_STOREFRONT_TOKEN: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_PREVIEW_SECRET?: string
  readonly VITE_PREVIEW_VERIFY_ENDPOINT?: string
  readonly VITE_AVAILABILITY_STATUS?: string
  readonly VITE_GITHUB_USERNAME?: string
  readonly VITE_SNS_X_URL?: string
  readonly VITE_SNS_INSTAGRAM_URL?: string
  readonly VITE_SNS_NOTE_URL?: string
  readonly VITE_SNS_YOUTUBE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
