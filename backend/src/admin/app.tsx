import type { StrapiApp } from '@strapi/strapi/admin'

export default {
  config: {
    // 管理画面で利用できる言語
    locales: ['ja'],

    // ブラウザタブのタイトル
    head: {
      favicon: '/favicon.ico',
    },

    // カスタム翻訳 (Strapi の組み込みキーを上書き)
    translations: {
      ja: {
        // ホーム画面
        'app.components.HomePage.welcome': 'Creava CMS へようこそ',
        'app.components.HomePage.welcome.again': 'おかえりなさい',
        'app.components.HomePage.create-your-first-content-type': 'コンテンツを追加する',
        'app.components.HomePage.button.blog': 'ドキュメントを見る',

        // 共通
        'app.components.NotFoundPage.title': 'ページが見つかりません',
        'app.components.NotFoundPage.description': '存在しないページです。',

        // コンテンツマネージャー
        'content-manager.components.TableList.buttonLabel': '新規作成',
        'content-manager.actions.publish.label': '公開',
        'content-manager.actions.unpublish.label': '非公開',
        'content-manager.actions.save.label': '保存',
        'content-manager.actions.discard.label': '変更を破棄',
        'content-manager.actions.delete.label': '削除',

        // グローバル
        'global.save': '保存',
        'global.cancel': 'キャンセル',
        'global.delete': '削除',
        'global.confirm': '確認',
        'global.finish': '完了',
      },
    },

    // テーマカラー（ブランドに合わせた控えめなカスタマイズ）
    theme: {
      light: {
        colors: {
          primary100: '#f5f3ff',
          primary200: '#ede9fe',
          primary500: '#7c3aed',
          primary600: '#6d28d9',
          primary700: '#5b21b6',
        },
      },
      dark: {
        colors: {
          primary100: '#1e1b4b',
          primary200: '#2e1065',
          primary500: '#8b5cf6',
          primary600: '#7c3aed',
          primary700: '#6d28d9',
        },
      },
    },
  },

  bootstrap(app: StrapiApp) {
    // ──────────────────────────────────────────────────
    // Quick Actions — サイドバーにショートカットを追加
    // Strapi v5 の addMenuLink API を利用
    // ──────────────────────────────────────────────────
    const quickLinks: Parameters<typeof app.addMenuLink>[0][] = [
      {
        intlLabel: { id: 'creava.menu.news', defaultMessage: '📰 ニュース追加' },
        to: '/content-manager/collection-types/api::news-item.news-item/create',
        icon: () => null,
      },
      {
        intlLabel: { id: 'creava.menu.blog', defaultMessage: '✍️ ブログ追加' },
        to: '/content-manager/collection-types/api::blog-post.blog-post/create',
        icon: () => null,
      },
      {
        intlLabel: { id: 'creava.menu.works', defaultMessage: '🎬 作品追加' },
        to: '/content-manager/collection-types/api::work.work/create',
        icon: () => null,
      },
      {
        intlLabel: { id: 'creava.menu.events', defaultMessage: '📅 イベント追加' },
        to: '/content-manager/collection-types/api::event.event/create',
        icon: () => null,
      },
      {
        intlLabel: { id: 'creava.menu.store', defaultMessage: '🛍️ 商品追加' },
        to: '/content-manager/collection-types/api::store-product.store-product/create',
        icon: () => null,
      },
      {
        intlLabel: { id: 'creava.menu.fanclub', defaultMessage: '⭐ FC記事追加' },
        to: '/content-manager/collection-types/api::fanclub-content.fanclub-content/create',
        icon: () => null,
      },
    ]

    quickLinks.forEach((link) => {
      try {
        app.addMenuLink(link)
      } catch {
        // addMenuLink が利用できないバージョンでは無視
      }
    })
  },
}
