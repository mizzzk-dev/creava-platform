import { factories } from '@strapi/strapi'

/**
 * News はホームページ導線に必須のため、公開記事の read API は常に匿名アクセスを許可する。
 * （管理系操作は従来どおり認証必須）
 */
export default factories.createCoreRouter('api::news-item.news-item', {
  config: {
    find: { auth: false },
    findOne: { auth: false },
  },
})
