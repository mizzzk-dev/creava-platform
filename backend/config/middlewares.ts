import type { Core } from '@strapi/strapi';

// FRONTEND_URL はカンマ区切りで複数指定可能
// 例: FRONTEND_URL=https://mizzz.jp,https://www.mizzz.jp
const extraOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:5173',
        'http://localhost:4173',
        // 本番ドメイン（www なし / www あり 両方許可）
        'https://mizzz.jp',
        'https://www.mizzz.jp',
        // Strapi Cloud env var で追加 origin を注入できる
        ...extraOrigins,
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
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
