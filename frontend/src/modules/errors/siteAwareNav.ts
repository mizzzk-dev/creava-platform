import { ROUTES } from '@/lib/routeConstants'
import { isFanclubSite, isStoreSite, mainLink, storeLink, fanclubLink } from '@/lib/siteLinks'

export interface ErrorNavLink {
  to: string
  labelKey: string
  labelFallback: string
  icon: string
  descKey: string
  descFallback: string
  /** true の場合、外部サブドメインへのリンク */
  external?: boolean
  id: string
}

/**
 * サイト種別に応じたエラーページのクイックナビ（3〜4件を想定）。
 * main / store / fc で目的の違う導線を提供する。
 */
export function getErrorPageNavLinks(): ErrorNavLink[] {
  if (isStoreSite) {
    return [
      {
        id: 'store_home',
        to: ROUTES.STORE_HOME,
        labelKey: 'error.nav.storeHome',
        labelFallback: 'ストアトップ',
        icon: '⌂',
        descKey: 'error.nav.storeHomeDesc',
        descFallback: '最新ドロップ',
      },
      {
        id: 'store_products',
        to: ROUTES.STORE_PRODUCTS,
        labelKey: 'error.nav.storeProducts',
        labelFallback: '商品一覧',
        icon: '◇',
        descKey: 'error.nav.storeProductsDesc',
        descFallback: 'すべての商品',
      },
      {
        id: 'store_cart',
        to: ROUTES.STORE_CART,
        labelKey: 'error.nav.storeCart',
        labelFallback: 'カートを見る',
        icon: '◈',
        descKey: 'error.nav.storeCartDesc',
        descFallback: '選択中のアイテム',
      },
      {
        id: 'store_contact',
        to: ROUTES.STORE_CONTACT,
        labelKey: 'nav.contact',
        labelFallback: 'お問い合わせ',
        icon: '✉',
        descKey: 'error.nav.contactDesc',
        descFallback: '直接連絡する',
      },
    ]
  }

  if (isFanclubSite) {
    return [
      {
        id: 'fc_home',
        to: ROUTES.HOME,
        labelKey: 'error.nav.fcHome',
        labelFallback: 'FCホーム',
        icon: '⌂',
        descKey: 'error.nav.fcHomeDesc',
        descFallback: '更新まとめ',
      },
      {
        id: 'fc_movies',
        to: ROUTES.FC_MOVIES,
        labelKey: 'error.nav.fcMovies',
        labelFallback: 'ムービー',
        icon: '▷',
        descKey: 'error.nav.fcMoviesDesc',
        descFallback: '限定動画',
      },
      {
        id: 'fc_join',
        to: ROUTES.FC_JOIN,
        labelKey: 'error.nav.fcJoin',
        labelFallback: '入会ご案内',
        icon: '✦',
        descKey: 'error.nav.fcJoinDesc',
        descFallback: '特典を見る',
      },
      {
        id: 'fc_contact',
        to: ROUTES.CONTACT,
        labelKey: 'nav.contact',
        labelFallback: 'お問い合わせ',
        icon: '✉',
        descKey: 'error.nav.contactDesc',
        descFallback: '直接連絡する',
      },
    ]
  }

  return [
    {
      id: 'main_home',
      to: ROUTES.HOME,
      labelKey: 'common.backToHome',
      labelFallback: 'ホーム',
      icon: '⌂',
      descKey: 'error.nav.mainHomeDesc',
      descFallback: 'トップページ',
    },
    {
      id: 'main_works',
      to: ROUTES.WORKS,
      labelKey: 'nav.works',
      labelFallback: '作品',
      icon: '◇',
      descKey: 'error.nav.mainWorksDesc',
      descFallback: '制作一覧',
    },
    {
      id: 'main_events',
      to: ROUTES.EVENTS,
      labelKey: 'nav.events',
      labelFallback: 'イベント',
      icon: '◈',
      descKey: 'error.nav.mainEventsDesc',
      descFallback: 'イベント一覧',
    },
    {
      id: 'main_contact',
      to: ROUTES.CONTACT,
      labelKey: 'nav.contact',
      labelFallback: 'お問い合わせ',
      icon: '✉',
      descKey: 'error.nav.contactDesc',
      descFallback: '直接連絡する',
    },
  ]
}

/**
 * サイト種別ラベル（エラーページの eyebrow に表示）。
 */
export function getSiteLabel(): string {
  if (isStoreSite) return 'store'
  if (isFanclubSite) return 'fanclub'
  return 'main'
}

/**
 * サイト横断用導線（main ⇔ store ⇔ fc）。エラー時の回遊性担保用。
 */
export function getCrossSiteLinks() {
  return {
    main: mainLink('/'),
    store: storeLink('/'),
    fanclub: fanclubLink('/'),
  }
}
