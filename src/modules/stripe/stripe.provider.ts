import { Provider } from '@nestjs/common'
import Stripe from 'stripe'
import { STRIPE_CLIENT, STRIPE_MODULE_OPTIONS } from './stripe.constants'
import { StripeModuleOptions } from './types/stripe-module-options.interface'

export function createStripeProvider(options: StripeModuleOptions): Provider {
  return {
    // provide: Stripe,
    provide: STRIPE_CLIENT,
    useValue: new Stripe(options.apiKey, { ...options.stripeConfig, typescript: true }),
    // inject: [STRIPE_MODULE_OPTIONS],
  }
}
