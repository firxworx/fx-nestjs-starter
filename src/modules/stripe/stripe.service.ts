import { Inject, Injectable, InternalServerErrorException, Scope } from '@nestjs/common'
import { STRIPE_MODULE_OPTIONS } from './stripe.constants'
import { StripeModuleOptions } from './types/stripe-module-options.interface'
import Stripe from 'stripe'

import { STRIPE_CLIENT } from './stripe.constants'

@Injectable({
  scope: Scope.DEFAULT,
})
export class StripeService {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripeClient: Stripe,
    @Inject(STRIPE_MODULE_OPTIONS) private stripeModuleOptions: StripeModuleOptions,
  ) {}

  /**
   * Retrieve a list of Stripe Customers.
   */
  getCustomers(params?: Stripe.CustomerListParams): Stripe.ApiListPromise<Stripe.Customer> {
    return this.stripeClient.customers.list(params)
  }

  /**
   * Retrieve a Stripe Customer with the given Stripe customer id.
   * Customers that have been deleted on Stripe include a `deleted` property with value `true`.
   */
  getCustomer(stripeCustomerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    return this.stripeClient.customers.retrieve(stripeCustomerId)
  }

  /**
   * Create a new Stripe Customer with the given name, email, and optional additional data.
   */
  createCustomer(
    name: string,
    email?: string,
    params?: Omit<Stripe.CustomerCreateParams, 'name' | 'email'>,
  ): Promise<Stripe.Response<Stripe.Customer>> {
    return this.stripeClient.customers.create({
      name,
      email,
      ...(params ? { params } : {}),
    })
  }

  /**
   * Update a Stripe Customer's information.
   */
  updateCustomer(
    stripeCustomerId: string,
    params: Stripe.CustomerUpdateParams,
  ): Promise<Stripe.Response<Stripe.Customer>> {
    return this.stripeClient.customers.update(stripeCustomerId, params)
  }

  /**
   * Retrieve a list of the given customer's credit cards.
   */
  public async getCustomerCreditCards(stripeCustomerId: string) {
    return this.stripeClient.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    })
  }

  /**
   * Set default credit card for the given customer.
   */
  setCustomerDefaultCreditCard(
    stripeCustomerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.Response<Stripe.Customer>> {
    // try {
    return this.stripeClient.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })
    // } catch (error: unknown) {
    //   // if (error?.type === StripeError.InvalidRequest) {
    //   //   throw new BadRequestException('Wrong credit card chosen')
    //   // }
    //   throw new InternalServerErrorException()
    // }
  }

  /**
   * Delete the Stripe customer with the given id.
   */
  deleteCustomer(stripeCustomerId: string): Promise<Stripe.Response<Stripe.DeletedCustomer>> {
    return this.stripeClient.customers.del(stripeCustomerId)
  }

  /**
   * Retrieve a Stripe Customer with expanded balances.
   *
   * @todo - multi-currency this
   */
  async getCustomerWithBalances(
    stripeCustomerId: string,
  ): Promise<Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>> {
    return this.stripeClient.customers.retrieve(stripeCustomerId, { expand: ['balances'] })
  }

  /**
   * Create a Payment Intent with the given arguments.
   *
   * @param stripeCustomerId
   * @param paymentMethodId
   * @param amount amount in smallest currency unit (e.g. cents for usd or cad)
   * @param currency 3-letter lowercase iso currency code
   * @param params other stripe params to create a payment intent (e.g. a common pairing is `off_session: true` + `confirm: true`)
   * @returns
   */
  public async createPaymentIntent(
    stripeCustomerId: string,
    paymentMethodId: string,
    amount: number,
    currency: string,
    params?: Omit<Stripe.PaymentIntentCreateParams, 'customer' | 'payment_method' | 'amount' | 'currency'>,
  ) {
    return this.stripeClient.paymentIntents.create({
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      amount,
      currency: currency ?? this.stripeModuleOptions.defaultCurrency ?? 'usd',
      ...(params ? { params } : {}),
    })
  }

  /**
   * Create setup intent for the given customer with the given payment method.
   *
   * @param stripeCustomerId
   * @param paymentMethodId
   * @returns
   */
  public async createSetupIntent(
    stripeCustomerId: string,
    paymentMethodId: string,
    params?: Omit<Stripe.SetupIntentCreateParams, 'customer' | 'payment_method'>,
  ) {
    return this.stripeClient.setupIntents.create({
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      ...(params ? { params } : {}),
    })
  }

  public async createSubscription(stripeCustomerId: string, priceId: string) {
    try {
      return await this.stripeClient.subscriptions.create({
        customer: stripeCustomerId,
        items: [
          {
            price: priceId,
          },
        ],
      })
    } catch (error) {
      // if (error?.code === StripeError.ResourceMissing) {
      //   throw new BadRequestException('Cannot create subscription: payment method not set up')
      // }
      throw new InternalServerErrorException()
    }
  }

  public async listSubscriptions(stripeCustomerId: string, priceId: string) {
    return this.stripeClient.subscriptions.list({
      customer: stripeCustomerId,
      price: priceId,
      expand: ['data.latest_invoice', 'data.latest_invoice.payment_intent'],
    })
  }
}
