import type { Core } from '@strapi/strapi';

// FRONTEND_URL はカンマ区切りで複数指定可能
// 例: FRONTEND_URL=https://mizzz.jp,https://www.mizzz.jp
const extraOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'global::json-api-error',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      // 本番: www あり / なしの両方を許可
      // Cloud 側で FRONTEND_URL に追加ドメインを渡す
      origin: [
        'http://localhost:5173',
        'http://localhost:4173',
        'https://mizzz.jp',
        'https://www.mizzz.jp',
        ...extraOrigins,
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      credentials: false,
      keepHeaderOnError: true,
      maxAge: 86400,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
