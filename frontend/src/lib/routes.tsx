import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import HomePage from '@/pages/HomePage'
import SkeletonDetail from '@/components/common/SkeletonDetail'
import { ROUTES } from './routeConstants'
import { isMainSite, isFanclubSite } from './siteLinks'
import { isStoreSite } from './siteLinks'
import StoreLayout from '@/components/layout/StoreLayout'
import FanclubLayout from '@/components/layout/FanclubLayout'
import StorefrontHomePage from '@/pages/storefront/StorefrontHomePage'
import StorefrontProductsPage from '@/pages/storefront/StorefrontProductsPage'
import StorefrontCollectionPage from '@/pages/storefront/StorefrontCollectionPage'
import CampaignLandingPage from '@/pages/shared/CampaignLandingPage'
import StorefrontGuidePage from '@/pages/storefront/StorefrontGuidePage'
import StorefrontShippingPolicyPage from '@/pages/storefront/StorefrontShippingPolicyPage'
import StorefrontReturnsPage from '@/pages/storefront/StorefrontReturnsPage'
import StorefrontLegalPage from '@/pages/storefront/StorefrontLegalPage'
import StorefrontContactRedirectPage from '@/pages/storefront/StorefrontContactRedirectPage'
import CheckoutResultPage from '@/pages/shared/CheckoutResultPage'
import {
  FanclubAboutSitePage,
  FanclubGalleryDetailPage,
  FanclubGalleryPage,
  FanclubGuidePage,
  FanclubHomeHubPage,
  FanclubJoinPage,
  FanclubLegalIndexPage,
  FanclubLoginPage,
  FanclubMemberStorePage,
  FanclubMoviesDetailPage,
  FanclubMoviesPage,
  FanclubMyPageSite,
  FanclubResetPasswordPage,
  FanclubSchedulePage,
  FanclubSubscriptionPolicyPage,
  FanclubTicketsDetailPage,
  FanclubTicketsPage,
  FanclubVerifyEmailPage,
} from '@/pages/fc/FanclubSitePages'
import FanclubAuthGuard from '@/components/guards/FanclubAuthGuard'
import AuthCallbackPage from '@/pages/AuthCallbackPage'

// Lazy-loaded pages — excluded from the initial bundle
const WorksPage = lazy(() => import('@/pages/WorksPage'))
const WorkDetailPage = lazy(() => import('@/pages/WorkDetailPage'))
const NewsPage = lazy(() => import('@/pages/NewsPage'))
const NewsDetailPage = lazy(() => import('@/pages/NewsDetailPage'))
const BlogPage = lazy(() => import('@/pages/BlogPage'))
const BlogDetailPage = lazy(() => import('@/pages/BlogDetailPage'))
const FanclubPage = lazy(() => import('@/pages/FanclubPage'))
const FanclubDetailPage = lazy(() => import('@/pages/FanclubDetailPage'))
const EventsPage = lazy(() => import('@/pages/EventsPage'))
const EventDetailPage = lazy(() => import('@/pages/EventDetailPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const StorePage = lazy(() => import('@/pages/StorePage'))
const StoreDetailPage = lazy(() => import('@/pages/StoreDetailPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const MemberPage = lazy(() => import('@/pages/MemberPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage'))
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'))
const CookiePolicyPage = lazy(() => import('@/pages/legal/CookiePolicyPage'))
const TokushohoPage = lazy(() => import('@/pages/legal/TokushohoPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const PreviewPage = lazy(() => import('@/pages/PreviewPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const PricingPage = lazy(() => import('@/pages/PricingPage'))
const FAQPage = lazy(() => import('@/pages/FAQPage'))
const SupportCenterPage = lazy(() => import('@/pages/support/SupportCenterPage'))
const SupportGuideDetailPage = lazy(() => import('@/pages/support/SupportGuideDetailPage'))
const DiscoveryPage = lazy(() => import('@/pages/DiscoveryPage'))
const LegacySubdomainRedirectPage = lazy(() => import('@/pages/LegacySubdomainRedirectPage'))
const InternalAdminPage = lazy(() => import('@/pages/internal/InternalAdminPage'))
const NotificationCenterPage = lazy(() => import('@/pages/NotificationCenterPage'))
const StatusPage = lazy(() => import('@/pages/StatusPage'))

// 定数は循環参照を避けるため routeConstants から取得し re-export する
export { ROUTES, detailPath } from './routeConstants'

function PageLoader() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <SkeletonDetail />
    </div>
  )
}

export function AppRoutes() {
  if (isStoreSite) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path={ROUTES.STORE_HOME} element={<StorefrontHomePage />} />
            <Route path={ROUTES.STORE_PRODUCTS} element={<StorefrontProductsPage />} />
            <Route path={ROUTES.STORE_PRODUCT_DETAIL} element={<StoreDetailPage />} />
            <Route path={ROUTES.STORE_CART} element={<CartPage />} />
            <Route path={ROUTES.STORE_CHECKOUT_SUCCESS} element={<CheckoutResultPage title="ご購入ありがとうございます" description="決済が完了しました。注文状態はWebhook経由で同期されます。" backTo={ROUTES.STORE_PRODUCTS} backLabel="商品一覧へ戻る" />} />
            <Route path={ROUTES.STORE_CHECKOUT_CANCEL} element={<CheckoutResultPage title="決済をキャンセルしました" description="決済は完了していません。内容を見直して再度お試しください。" backTo={ROUTES.STORE_CART} backLabel="カートへ戻る" />} />
            <Route path={ROUTES.CART} element={<CartPage />} />
            <Route path={ROUTES.STORE_COLLECTION} element={<StorefrontCollectionPage />} />
            <Route path={ROUTES.STORE_CAMPAIGN} element={<CampaignLandingPage />} />
            <Route path={ROUTES.NEWS} element={<NewsPage />} />
            <Route path={ROUTES.NEWS_DETAIL} element={<NewsDetailPage />} />
            <Route path={ROUTES.FAQ} element={<FAQPage />} />
            <Route path={ROUTES.SUPPORT_CENTER} element={<SupportCenterPage />} />
            <Route path={ROUTES.SUPPORT_GUIDE_DETAIL} element={<SupportGuideDetailPage />} />
            <Route path={ROUTES.STATUS} element={<StatusPage />} />
            <Route path={ROUTES.DISCOVERY} element={<DiscoveryPage />} />
            <Route path={ROUTES.STORE_GUIDE} element={<StorefrontGuidePage />} />
            <Route path={ROUTES.STORE_SHIPPING_POLICY} element={<StorefrontShippingPolicyPage />} />
            <Route path={ROUTES.STORE_RETURNS} element={<StorefrontReturnsPage />} />
            <Route path={ROUTES.STORE_CONTACT} element={<StorefrontContactRedirectPage />} />
            <Route path={ROUTES.STORE_LEGAL} element={<StorefrontLegalPage />} />
            <Route path={ROUTES.STORE_TERMS} element={<TermsPage />} />
            <Route path={ROUTES.STORE_PRIVACY} element={<PrivacyPolicyPage />} />
            <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackPage />} />
            <Route path={ROUTES.NOTIFICATION_CENTER} element={<NotificationCenterPage />} />
            <Route path={ROUTES.INTERNAL_ADMIN} element={<InternalAdminPage />} />
            <Route path={ROUTES.LEGAL_PRIVACY} element={<PrivacyPolicyPage />} />
            <Route path={ROUTES.LEGAL_TERMS} element={<TermsPage />} />
            <Route path={ROUTES.LEGAL_TRADE} element={<TokushohoPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    )
  }

  if (isFanclubSite) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<FanclubLayout />}>
            <Route path={ROUTES.HOME} element={<FanclubHomeHubPage />} />
            <Route path={ROUTES.FC_ABOUT} element={<FanclubAboutSitePage />} />
            <Route path={ROUTES.FC_JOIN} element={<FanclubJoinPage />} />
            <Route path={ROUTES.FC_LOGIN} element={<FanclubLoginPage />} />
            <Route path={ROUTES.FC_LOGIN_RESET_PASSWORD} element={<FanclubResetPasswordPage />} />
            <Route path={ROUTES.FC_LOGIN_VERIFY_EMAIL} element={<FanclubVerifyEmailPage />} />
            <Route path={ROUTES.FC_MYPAGE} element={<FanclubAuthGuard><FanclubMyPageSite /></FanclubAuthGuard>} />
            <Route path={ROUTES.MEMBER} element={<FanclubAuthGuard><MemberPage /></FanclubAuthGuard>} />
            <Route path={ROUTES.NOTIFICATION_CENTER} element={<FanclubAuthGuard><NotificationCenterPage /></FanclubAuthGuard>} />
            <Route path={ROUTES.NEWS} element={<NewsPage />} />
            <Route path={ROUTES.NEWS_DETAIL} element={<NewsDetailPage />} />
            <Route path={ROUTES.BLOG} element={<BlogPage />} />
            <Route path={ROUTES.BLOG_DETAIL} element={<BlogDetailPage />} />
            <Route path={ROUTES.FC_MOVIES} element={<FanclubMoviesPage />} />
            <Route path={ROUTES.FC_MOVIE_DETAIL} element={<FanclubMoviesDetailPage />} />
            <Route path={ROUTES.FC_GALLERY} element={<FanclubGalleryPage />} />
            <Route path={ROUTES.FC_GALLERY_DETAIL} element={<FanclubGalleryDetailPage />} />
            <Route path={ROUTES.FC_SCHEDULE} element={<FanclubAuthGuard><FanclubSchedulePage /></FanclubAuthGuard>} />
            <Route path={ROUTES.EVENTS} element={<EventsPage />} />
            <Route path={ROUTES.EVENT_DETAIL} element={<EventDetailPage />} />
            <Route path={ROUTES.FC_TICKETS} element={<FanclubAuthGuard><FanclubTicketsPage /></FanclubAuthGuard>} />
            <Route path={ROUTES.FC_TICKET_DETAIL} element={<FanclubAuthGuard><FanclubTicketsDetailPage /></FanclubAuthGuard>} />
            <Route path={ROUTES.FC_MEMBER_STORE} element={<FanclubAuthGuard><FanclubMemberStorePage /></FanclubAuthGuard>} />
            <Route path={ROUTES.FC_CAMPAIGN} element={<CampaignLandingPage />} />
            <Route path={ROUTES.FAQ} element={<FAQPage />} />
            <Route path={ROUTES.SUPPORT_CENTER} element={<SupportCenterPage />} />
            <Route path={ROUTES.SUPPORT_GUIDE_DETAIL} element={<SupportGuideDetailPage />} />
            <Route path={ROUTES.STATUS} element={<StatusPage />} />
            <Route path={ROUTES.DISCOVERY} element={<DiscoveryPage />} />
            <Route path={ROUTES.FC_GUIDE} element={<FanclubGuidePage />} />
            <Route path={ROUTES.CONTACT} element={<StorefrontContactRedirectPage />} />
            <Route path={ROUTES.FC_LEGAL} element={<FanclubLegalIndexPage />} />
            <Route path={ROUTES.FC_TERMS} element={<TermsPage />} />
            <Route path={ROUTES.FC_PRIVACY} element={<PrivacyPolicyPage />} />
            <Route path={ROUTES.LEGAL_PRIVACY} element={<PrivacyPolicyPage />} />
            <Route path={ROUTES.LEGAL_TERMS} element={<TermsPage />} />
            <Route path={ROUTES.FC_COMMERCE_LAW} element={<TokushohoPage />} />
            <Route path={ROUTES.FC_SUBSCRIPTION_POLICY} element={<FanclubSubscriptionPolicyPage />} />
            <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackPage />} />
            <Route path={ROUTES.INTERNAL_ADMIN} element={<InternalAdminPage />} />
            <Route path={ROUTES.FC_CHECKOUT_SUCCESS} element={<CheckoutResultPage title="入会手続きを受け付けました" description="継続課金の状態同期が完了次第、会員ステータスへ反映されます。" backTo={ROUTES.FC_MYPAGE} backLabel="マイページへ" />} />
            <Route path={ROUTES.FC_CHECKOUT_CANCEL} element={<CheckoutResultPage title="入会手続きをキャンセルしました" description="課金は確定していません。タイミングを変えて再度お試しください。" backTo={ROUTES.FC_JOIN} backLabel="入会ページへ戻る" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.WORKS} element={<WorksPage />} />
          <Route path={ROUTES.WORK_DETAIL} element={<WorkDetailPage />} />
          <Route path={ROUTES.NEWS} element={<NewsPage />} />
          <Route path={ROUTES.NEWS_DETAIL} element={<NewsDetailPage />} />
          <Route path={ROUTES.BLOG} element={<BlogPage />} />
          <Route path={ROUTES.BLOG_DETAIL} element={<BlogDetailPage />} />
          <Route path={ROUTES.FANCLUB} element={isMainSite ? <LegacySubdomainRedirectPage target="fanclub" /> : <FanclubPage />} />
          <Route path={ROUTES.FANCLUB_DETAIL} element={isMainSite ? <LegacySubdomainRedirectPage target="fanclub" /> : <FanclubDetailPage />} />
          <Route path={ROUTES.EVENTS} element={<EventsPage />} />
          <Route path={ROUTES.EVENT_DETAIL} element={<EventDetailPage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />
          <Route path={ROUTES.STORE} element={isMainSite ? <LegacySubdomainRedirectPage target="store" /> : <StorePage />} />
          <Route path={ROUTES.STORE_DETAIL} element={isMainSite ? <LegacySubdomainRedirectPage target="store" /> : <StoreDetailPage />} />
          <Route path={ROUTES.CART} element={isMainSite ? <LegacySubdomainRedirectPage target="store" /> : <CartPage />} />
          <Route path={ROUTES.MEMBER} element={<MemberPage />} />
          <Route path={ROUTES.NOTIFICATION_CENTER} element={<NotificationCenterPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.PRICING} element={<PricingPage />} />
          <Route path={ROUTES.FAQ} element={<FAQPage />} />
          <Route path={ROUTES.SUPPORT_CENTER} element={<SupportCenterPage />} />
          <Route path={ROUTES.SUPPORT_GUIDE_DETAIL} element={<SupportGuideDetailPage />} />
          <Route path={ROUTES.STATUS} element={<StatusPage />} />
            <Route path={ROUTES.DISCOVERY} element={<DiscoveryPage />} />
          <Route path={ROUTES.LEGAL_PRIVACY} element={<PrivacyPolicyPage />} />
          <Route path={ROUTES.LEGAL_TERMS} element={<TermsPage />} />
          <Route path={ROUTES.LEGAL_COOKIE} element={<CookiePolicyPage />} />
          <Route path={ROUTES.LEGAL_TRADE} element={<TokushohoPage />} />
          <Route path={ROUTES.PREVIEW} element={<PreviewPage />} />
          <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
