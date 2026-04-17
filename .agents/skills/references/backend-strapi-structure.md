# backend-strapi-structure

- `src/api/*`: content-types, routes, controllers, services
- `config/*`: server, database, middlewares, plugins
- `scripts/seed/*`: fixture投入

## 注意
- content-type/relation/populate 変更は frontend 側の型・表示に直結。
- public endpoint（問い合わせ等）の互換性を重視。
- CORS に main/store/fc オリジンが必要。
