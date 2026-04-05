import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import { useCart } from '@/modules/cart/context'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import { formatPriceNum } from '@/utils'
import { useCurrentUser } from '@/hooks'

export default function CartPage() {
  const { t } = useTranslation()
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart } = useCart()
  const { user, isSignedIn } = useCurrentUser()

  const canPurchaseFc = isSignedIn && (user?.role === 'member' || user?.role === 'admin')
  const hasFcOnlyBlocked = items.some((item) => item.accessStatus === 'fc_only' && !canPurchaseFc)
  const checkoutLink = items.find((item) => item.stripeLink)?.stripeLink

  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <PageHead title={t('cart.title', { defaultValue: 'カート' })} description={t('cart.description', { defaultValue: '選択した商品の確認ページです。' })} />

      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">store / cart</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{t('cart.title', { defaultValue: 'カート' })}</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('cart.helper', { defaultValue: '数量・購入条件を確認して、外部決済へ進みます。' })}</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('cart.empty', { defaultValue: 'カートは空です。' })}</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{t('cart.emptySub', { defaultValue: 'Store から気になる商品を追加してください。' })}</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link to={ROUTES.STORE} className="inline-flex text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
              {t('cart.goStore', { defaultValue: 'ストアを見る' })} →
            </Link>
            <Link to={ROUTES.FANCLUB} className="inline-flex text-xs font-mono text-violet-500 hover:text-violet-400">
              {t('cart.seeFanclub', { defaultValue: 'Fanclub特典を見る' })} →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 rounded border border-gray-100 dark:border-gray-800 px-4">
            {items.map((item) => {
              const isFcOnlyBlocked = item.accessStatus === 'fc_only' && !canPurchaseFc

              return (
                <li key={item.slug} className="py-4">
                  <div className="flex items-center gap-4">
                    <Link to={detailPath.product(item.slug)} className="h-16 w-16 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{formatPriceNum(item.price, item.currency)}</p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-600">
                        {t('cart.itemSubtotal', { defaultValue: '小計' })}: {formatPriceNum(item.price * item.quantity, item.currency)}
                      </p>
                      {isFcOnlyBlocked && (
                        <p className="mt-1 text-xs text-violet-500">{t('cart.fcRestricted', { defaultValue: 'FC会員のみ購入できます。' })}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 rounded border border-gray-200 dark:border-gray-700 px-1 py-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                        aria-label={t('cart.decrease', { defaultValue: '数量を減らす' })}
                        className="h-7 w-7 rounded text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-sm text-gray-800 dark:text-gray-200">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                        aria-label={t('cart.increase', { defaultValue: '数量を増やす' })}
                        className="h-7 w-7 rounded text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                      >
                        ＋
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.slug)} className="text-xs text-gray-500 hover:text-red-500">
                      {t('cart.remove', { defaultValue: '削除' })}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-8 rounded border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('cart.totalItems', { defaultValue: '商品点数' })}</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">{itemCount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('cart.subtotal', { defaultValue: '小計' })}</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">{formatPriceNum(subtotal, 'JPY')}</span>
            </div>

            {hasFcOnlyBlocked && (
              <p className="mt-4 rounded border border-violet-100 bg-violet-50 px-3 py-2 text-xs text-violet-600 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-400">
                {t('cart.fcBlockedDetail', { defaultValue: 'FC限定商品が含まれています。決済前に会員ステータスをご確認ください。' })}
              </p>
            )}

            <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
              {t('cart.checkoutNote', { defaultValue: 'チェックアウトは外部決済ページへ遷移します。内容を確認してから進んでください。' })}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {checkoutLink ? (
                <a
                  href={checkoutLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
                >
                  {t('cart.checkout', { defaultValue: 'チェックアウトへ' })}
                </a>
              ) : (
                <Link to={ROUTES.STORE} className="inline-flex items-center text-sm text-gray-700 dark:text-gray-300">
                  {t('cart.selectCheckout', { defaultValue: '購入商品を選んでください' })}
                </Link>
              )}

              <Link to={ROUTES.STORE} className="inline-flex items-center justify-center border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm text-gray-600 dark:text-gray-300">
                {t('cart.continueShopping', { defaultValue: '買い物を続ける' })}
              </Link>

              <button
                onClick={clearCart}
                className="inline-flex items-center justify-center border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm text-gray-600 dark:text-gray-300"
              >
                {t('cart.clear', { defaultValue: 'カートを空にする' })}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
