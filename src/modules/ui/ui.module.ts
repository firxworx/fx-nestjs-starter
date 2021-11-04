import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { UiService } from './ui.service'
import { UiController } from './ui.controller'
import { StripeModule } from '../stripe/stripe.module'
import { StripeConfig } from '../stripe/types/stripe-config.interface'
import { StripeModuleOptions } from '../stripe/types/stripe-module-options.interface'

@Module({
  imports: [
    // @todo - pull stripe to own package - for now, e.g. on how to import to another module
    StripeModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): StripeModuleOptions => {
        const stripeConfig = config.get<StripeConfig>('stripe')

        if (!stripeConfig) {
          throw new Error('Error resolving Stripe config')
        }

        return {
          ...stripeConfig,
        }
      },
    }),
  ],
  controllers: [UiController],
  providers: [UiService],
  exports: [UiService],
})
export class UiModule {}
