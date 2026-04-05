import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import { useCart } from '@/modules/cart/context'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import { formatPriceNum } from '@/utils'
import { useCurrentUser } from '@/hooks'

export default function CartPage() {
  const { t } = useTranslation()
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart()
  const { user, isSignedIn } = useCurrentUser()

  const canPurchaseFc = isSignedIn && user?.role === 'member'

  const checkoutLink = items.find((item) => item.stripeLink)?.stripeLink

  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <PageHead title={t('cart.title', { defaultValue: 'カート' })} description={t('cart.description', { defaultValue: '選択した商品の確認ページです。' })} />

      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">store / cart</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{t('cart.title', { defaultValue: 'カート' })}</h1>
      </header>

      {items.length === 0 ? (
        <div className="rounded border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('cart.empty', { defaultValue: 'カートは空です。' })}</p>
          <Link to={ROUTES.STORE} className="mt-4 inline-flex text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
            {t('cart.goStore', { defaultValue: 'ストアを見る' })} →
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item) => {
              const isFcOnlyBlocked = item.accessStatus === 'fc_only' && !canPurchaseFc

              return (
                <li key={item.slug} className="py-4">
                  <div className="flex items-center gap-4">
                    <Link to={detailPath.product(item.slug)} className="h-16 w-16 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{formatPriceNum(item.price, item.currency)}</p>
                      {isFcOnlyBlocked && (
                        <p className="mt-1 text-xs text-violet-500">{t('cart.fcRestricted', { defaultValue: 'FC会員のみ購入できます。' })}</p>
                      )}
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.slug, Number(e.target.value))}
                      className="w-16 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
                    />
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
              <span className="text-gray-500 dark:text-gray-400">{t('cart.subtotal', { defaultValue: '小計' })}</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">{formatPriceNum(subtotal, 'JPY')}</span>
            </div>
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
