import { Inject, Injectable, Scope } from '@nestjs/common'
import Stripe from 'stripe'
import { STRIPE_CLIENT, STRIPE_MODULE_OPTIONS } from './stripe.constants'
import { StripeModuleOptions } from './types/stripe-module-options.interface'

// @Inject(STRIPE_MODULE_OPTIONS) public readonly options: StripeModuleOptions

@Injectable({
  scope: Scope.DEFAULT,
})
export class StripeService {
  // constructor(private readonly stripeClient: Stripe) {}
  constructor(@Inject(STRIPE_CLIENT) private readonly stripeClient: Stripe) {}
  buh = (): any => {
    return {
      hello: 'hi',
    }
  }
}
