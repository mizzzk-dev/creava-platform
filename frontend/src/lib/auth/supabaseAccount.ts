import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config'

function ensureSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase 設定が不足しています。')
  }
}

export async function sendSupabasePasswordReset(email: string, redirectTo: string): Promise<void> {
  ensureSupabaseConfig()
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  })

  if (!response.ok) {
    throw new Error(`パスワードリセット送信に失敗しました (${response.status})`)
  }
}

export async function requestSupabaseEmailChange(accessToken: string, nextEmail: string): Promise<void> {
  ensureSupabaseConfig()
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: nextEmail }),
  })

  if (!response.ok) {
    throw new Error(`メールアドレス変更リクエストに失敗しました (${response.status})`)
  }
}
