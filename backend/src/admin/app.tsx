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
        'app.components.HomePage.create-your-first-content-type':
          'コンテンツを追加する',
        'app.components.HomePage.button.blog': 'ドキュメントを見る',

        // Not Found
        'app.components.NotFoundPage.title': 'ページが見つかりません',
        'app.components.NotFoundPage.description': '存在しないページです。',

        // コンテンツマネージャー
        'content-manager.components.TableList.buttonLabel': '新規作成',
        'content-manager.actions.publish.label': '公開',
        'content-manager.actions.unpublish.label': '非公開',
        'content-manager.actions.save.label': '保存',
        'content-manager.actions.discard.label': '変更を破棄',
        'content-manager.actions.delete.label': '削除',
        'content-manager.header.title': 'コンテンツマネージャー',

        // コレクション表示名
        'content-manager.components.TableList.title': 'コンテンツ一覧',
        'content-manager.emptyState.firstSentence.plural': 'まだコンテンツがありません。',
        'content-manager.emptyState.firstSentence.singular': 'まだコンテンツがありません。',
        'content-manager.components.TableList.empty': 'コンテンツがありません。新規作成してください。',

        // フィールド
        'content-manager.components.Inputs.label': 'フィールド',
        'content-manager.relation.connect': '追加',
        'content-manager.relation.disconnect': '削除',
        'content-manager.relation.notAvailable': '（なし）',

        // ドラフト/公開
        'content-manager.containers.ListPage.draft': '下書き',
        'content-manager.containers.ListPage.published': '公開済み',
        'content-manager.components.DraftAndPublish.created.draft': '下書きとして保存しました',
        'content-manager.components.DraftAndPublish.created.published': '公開しました',

        // 検索・フィルター
        'content-manager.components.TableList.search': 'コンテンツを検索',
        'content-manager.components.TableList.filter': 'フィルター',

        // グローバル
        'global.save': '保存',
        'global.cancel': 'キャンセル',
        'global.delete': '削除',
        'global.confirm': '確認',
        'global.finish': '完了',
        'global.back': '戻る',
        'global.search': '検索',
        'global.loading': '読み込み中...',
        'global.yes': 'はい',
        'global.no': 'いいえ',

        // メディアライブラリ
        'upload.components.UploadProgress.title': 'アップロード中',
        'upload.actions.cancel': 'キャンセル',

        // エラー
        'notification.success': '保存しました',
        'notification.error': 'エラーが発生しました',
        'notification.warning': '警告',
      },
    },

    // テーマカラー（ブランドに合わせたバイオレット）
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
    // =====================================================================
    // Creava CMS — Quick Reference Links
    // サイドバーに「ショートカット」リンクを追加します。
    // ※ addMenuLink は Strapi 5 の admin SDK が正式に対応した場合に有効化。
    // =====================================================================

    // ---- コンテンツ型ショートカット（将来拡張用）----
    // app.addMenuLink({
    //   to: '/content-manager/collection-types/api::news-item.news-item',
    //   icon: () => null,
    //   intlLabel: { id: 'news-item', defaultMessage: 'ニュースを追加' },
    //   Component: async () => ({ default: () => null }),
    // })

    // コンソールに運用ヒントを表示（dev 環境のみ）
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info(
        '%c[Creava CMS] 運用ガイド: backend/docs/STRAPI_GUIDE.md',
        'color: #7c3aed; font-weight: bold;',
      )
      // eslint-disable-next-line no-console
      console.table({
        'ニュース追加':    '/content-manager/collection-types/api::news-item.news-item',
        'ブログ追加':      '/content-manager/collection-types/api::blog-post.blog-post',
        '作品追加':        '/content-manager/collection-types/api::work.work',
        'イベント追加':    '/content-manager/collection-types/api::event.event',
        'ファンクラブ追加': '/content-manager/collection-types/api::fanclub-content.fanclub-content',
        '設定':           '/content-manager/single-types/api::site-setting.site-setting',
      })
    }
  },
}
