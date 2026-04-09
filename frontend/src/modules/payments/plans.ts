import { fetchCollection } from '@/lib/api/strapi'
import type { StrapiListResponse } from '@/types'
import type { MembershipPlan } from './types'

export async function getMembershipPlans(): Promise<StrapiListResponse<MembershipPlan>> {
  return fetchCollection<MembershipPlan>('/membership-plans', {
    fields: ['name', 'slug', 'description', 'membershipType', 'accessLevel', 'billingCycle', 'price', 'currency', 'stripeProductId', 'stripePriceId', 'isJoinable', 'displayPriority'],
    sort: ['displayPriority:desc', 'price:asc'],
    pagination: { pageSize: 10, withCount: false },
  })
}
