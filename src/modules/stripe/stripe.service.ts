import { Inject, Injectable, Scope } from '@nestjs/common'
import Stripe from 'stripe'
import { STRIPE_CLIENT } from './stripe.constants'

@Injectable({
  scope: Scope.DEFAULT,
})
export class StripeService {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripeClient: Stripe, // @Inject(STRIPE_MODULE_OPTIONS) private stripeModuleOptions: StripeModuleOptions,
  ) {}

  async getCustomers() {
    return this.stripeClient.customers.list({})
  }

  async getCustomerBalance(stripeCustomerId: string) {
    return this.stripeClient.customers.retrieve(stripeCustomerId, { expand: ['balances'] })
  }

  async createStripeCustomer(name: string) {
    const customer = await this.stripeClient.customers.create({
      name,
    })

    return { stripeCustomerId: customer.id }
  }
}
