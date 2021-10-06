import Stripe from 'stripe'

export interface StripeConfig {
  apiKey: string
  stripeConfig: Stripe.StripeConfig
  defaultCurrency?: string
}
