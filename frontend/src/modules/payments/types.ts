export interface MembershipPlan {
  id: number
  documentId: string
  name: string
  slug: string
  description: string | null
  membershipType: 'free' | 'paid' | 'premium'
  accessLevel: 'free' | 'paid' | 'premium'
  billingCycle: 'monthly' | 'yearly'
  price: number
  currency: string
  stripeProductId: string | null
  stripePriceId: string | null
  isJoinable: boolean
  displayPriority: number
}
