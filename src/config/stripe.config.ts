import { registerAs } from '@nestjs/config'
import type { StripeConfig } from '../modules/stripe/types/stripe-config.interface'

export default registerAs('stripe', (): StripeConfig => {
  return {
    apiKey: process.env.STRIPE_API_KEY ?? '',
    stripeConfig: {
      apiVersion: (process.env.STRIPE_API_VERSION ?? '') as StripeConfig['stripeConfig']['apiVersion'],
    },
  }
})
