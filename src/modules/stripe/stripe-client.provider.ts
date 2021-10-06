import { Provider } from '@nestjs/common'
import Stripe from 'stripe'
import { STRIPE_CLIENT, STRIPE_MODULE_OPTIONS } from './stripe.constants'
import { StripeModuleOptions } from './types/stripe-module-options.interface'

// export function createStripeClient(options: StripeModuleOptions): Provider<Stripe> {
//   return {
//     // provide: Stripe,
//     provide: STRIPE_CLIENT,
//     useValue: new Stripe(options.apiKey, { ...options.stripeConfig, typescript: true }),
//     // inject: [STRIPE_MODULE_OPTIONS],
//   }
// }

export function createStripeClientProvider(): Provider<Stripe> {
  return {
    provide: STRIPE_CLIENT,
    useFactory: (options: StripeModuleOptions): Stripe => {
      return new Stripe(options.apiKey, { ...options.stripeConfig, typescript: true })
    },
    inject: [STRIPE_MODULE_OPTIONS],
  }
}
