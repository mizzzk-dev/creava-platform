type RevenueInput = {
  eventIdempotencyKey: string
  revenueType: 'store_order' | 'fc_subscription' | 'refund' | 'partial_refund' | 'shipping' | 'discount_adjustment' | 'manual_adjustment'
  revenueSource: 'store' | 'fanclub' | 'main' | 'cross'
  revenueStatus: 'recognized' | 'pending' | 'reversed' | 'failed' | 'canceled'
  financialEventType: string
  financialEventAt: string
  sourceSite: 'store' | 'fc' | 'main' | 'cross'
  grossAmount?: number
  netAmount?: number
  discountAmount?: number
  shippingFee?: number
  taxAmount?: number
  refundAmount?: number
  partialRefundAmount?: number
  currency?: string
  orderId?: string | null
  subscriptionId?: string | null
  paymentId?: string | null
  refundId?: string | null
  userId?: string | null
  campaignId?: string | null
  couponId?: string | null
  loyaltyImpactState?: string | null
  sourceOfTruth?: 'stripe_webhook' | 'internal_adjustment' | 'backfill'
  syncState?: 'in_sync' | 'pending' | 'failed' | 'duplicate_ignored'
  metadata?: Record<string, unknown>
}

function toReportPeriod(value: string): string {
  return value.slice(0, 7)
}

export async function upsertRevenueRecord(strapi: any, input: RevenueInput): Promise<void> {
  const existing = await strapi.documents('api::revenue-record.revenue-record').findFirst({
    filters: { eventIdempotencyKey: { $eq: input.eventIdempotencyKey } },
  })

  const payload = {
    ...input,
    reportPeriod: toReportPeriod(input.financialEventAt),
    recognizedAt: input.revenueStatus === 'recognized' ? input.financialEventAt : null,
    sourceOfTruth: input.sourceOfTruth ?? 'stripe_webhook',
    syncState: input.syncState ?? 'in_sync',
    summaryState: 'raw',
    currency: (input.currency ?? 'JPY').toUpperCase(),
    grossAmount: Number(input.grossAmount ?? 0),
    netAmount: Number(input.netAmount ?? 0),
    discountAmount: Number(input.discountAmount ?? 0),
    shippingFee: Number(input.shippingFee ?? 0),
    taxAmount: Number(input.taxAmount ?? 0),
    refundAmount: Number(input.refundAmount ?? 0),
    partialRefundAmount: Number(input.partialRefundAmount ?? 0),
  }

  if (existing?.documentId) {
    await strapi.documents('api::revenue-record.revenue-record').update({
      documentId: existing.documentId,
      data: payload,
    })
    return
  }

  await strapi.documents('api::revenue-record.revenue-record').create({ data: payload })
}
