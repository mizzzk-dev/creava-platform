import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createCustomerPortalSession } from '@/modules/payments/api'

describe('payments portal auth compatibility', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_CMS_PROVIDER', 'wordpress')
    vi.stubEnv('VITE_WORDPRESS_API_URL', 'https://example.com/wp-json/creava/v1')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('billing portal は bearer token を送信する', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ url: 'https://billing.example.com/session' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createCustomerPortalSession({ authToken: 'jwt-token' })

    expect(result.url).toContain('billing.example.com')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/wp-json/creava/v1/billing/portal',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    )
  })

  it('unauthorized と misconfiguration を区別したエラーを返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      statusText: 'Unauthorized',
      headers: { 'content-type': 'application/json' },
    })))

    await expect(createCustomerPortalSession({ authToken: 'expired' })).rejects.toMatchObject({
      status: 401,
      statusText: 'Unauthorized',
    })
  })
})
