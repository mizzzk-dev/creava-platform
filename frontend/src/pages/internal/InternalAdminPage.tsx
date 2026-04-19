import { useState } from 'react'
import { useCurrentUser } from '@/hooks'
import { useInternalAdminApi, type InternalLookupUser, type InternalOrderLookupItem } from '@/modules/internal-admin/api'

export default function InternalAdminPage() {
  const { user, isSignedIn } = useCurrentUser()
  const api = useInternalAdminApi()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<InternalLookupUser[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState('suspended')
  const [message, setMessage] = useState<string | null>(null)
  const [orderQuery, setOrderQuery] = useState('')
  const [orders, setOrders] = useState<InternalOrderLookupItem[]>([])

  if (!isSignedIn) return <section className="mx-auto max-w-4xl px-4 py-16">ログインが必要です。</section>
  if (user?.role !== 'admin') return <section className="mx-auto max-w-4xl px-4 py-16">internal admin は管理者ロールのみアクセスできます。</section>

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Internal Admin Console (Beta)</h1>
      <p className="mt-2 text-sm text-gray-500">user lookup / summary / danger operations を最小機能で提供します。</p>

      <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
        <p className="text-xs text-gray-500">user lookup</p>
        <div className="mt-2 flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="email で検索" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.searchUsers(query).then((res) => setUsers(res.users)).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
          >検索</button>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {users.map((item) => (
            <li key={item.logtoUserId} className="rounded border border-gray-200 p-3 dark:border-gray-700">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  setMessage(null)
                  api.getUserSummary(item.logtoUserId).then(setSelectedUser).catch((e: Error) => setMessage(e.message))
                }}
              >
                <p>{item.primaryEmail ?? item.logtoUserId}</p>
                <p className="text-xs text-gray-500">{item.membershipStatus} / {item.accountStatus} / {item.sourceSite}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>



      <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
        <p className="text-xs text-gray-500">order lookup</p>
        <div className="mt-2 flex gap-2">
          <input value={orderQuery} onChange={(e) => setOrderQuery(e.target.value)} placeholder="orderNumber / email / userId / paymentIntentId" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.searchOrders(orderQuery).then((res) => setOrders(res.items)).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
          >検索</button>
        </div>
        <ul className="mt-3 space-y-2 text-xs">
          {orders.map((item) => (
            <li key={item.id} className="rounded border border-gray-200 p-3 dark:border-gray-700">
              <p className="font-medium">{item.orderNumber}</p>
              <p className="text-gray-500">{item.paymentStatus} / {item.orderStatus} / {item.fulfillmentStatus} / {item.shipmentStatus} / return:{item.returnStatus}</p>
              <p className="text-gray-500">{item.totalAmount} {item.currency} · {item.email ?? item.userId ?? '-'}</p>
            </li>
          ))}
        </ul>
      </div>

      {selectedUser && (
        <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="text-lg font-medium">User Summary</h2>
          <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900">{JSON.stringify(selectedUser.userSummary, null, 2)}</pre>

          <div className="mt-4 rounded border border-rose-300 p-3 dark:border-rose-800">
            <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Danger Zone</p>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="操作理由 (必須)" className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            <div className="mt-2 flex flex-wrap gap-2">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-gray-300 px-2 py-2 text-sm">
                <option value="active">active</option>
                <option value="pending_review">pending_review</option>
                <option value="suspended">suspended</option>
                <option value="closed">closed</option>
              </select>
              <button
                type="button"
                className="rounded border border-rose-400 px-3 py-2 text-sm text-rose-700"
                onClick={() => {
                  api.updateAccountStatus(selectedUser.appUser.logtoUserId, status, reason)
                    .then(() => setMessage('accountStatus を更新しました。'))
                    .catch((e: Error) => setMessage(e.message))
                }}
              >accountStatus 更新</button>
              <button
                type="button"
                className="rounded border border-amber-400 px-3 py-2 text-sm text-amber-700"
                onClick={() => {
                  api.resetNotificationPreference(selectedUser.appUser.logtoUserId, reason)
                    .then(() => setMessage('notificationPreference をリセットしました。'))
                    .catch((e: Error) => setMessage(e.message))
                }}
              >通知設定リセット</button>
            </div>
          </div>
        </div>
      )}

      {message && <p className="mt-4 text-sm text-rose-600">{message}</p>}
    </section>
  )
}
