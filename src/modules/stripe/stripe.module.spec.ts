import { Test } from '@nestjs/testing'
import { StripeModule } from './stripe.module'
import Stripe from 'stripe'

describe('StripeModule', () => {
  const apiKey = 'pk_abcdefg'
  const stripeApiVersion: Stripe.LatestApiVersion = '2020-08-27'

  const stripeConfig = {
    apiVersion: stripeApiVersion,
  }

  describe('register', () => {
    it('should register stripe module', async () => {
      const module = await Test.createTestingModule({
        imports: [StripeModule.register({ apiKey, stripeConfig })],
      }).compile()

      const stripe = module.get<Stripe>(Stripe)

      expect(stripe).toBeDefined()
      expect(stripe).toBeInstanceOf(Stripe)
    })
  })
})
