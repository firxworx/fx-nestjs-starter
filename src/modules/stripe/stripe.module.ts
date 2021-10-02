import { DynamicModule, Module, Provider } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import Stripe from 'stripe'

import { STRIPE_CLIENT, STRIPE_MODULE_OPTIONS } from './stripe.constants'
import { StripeWebhookService } from './stripe-webhook.service'
import { createStripeProvider } from './stripe.provider'
import { StripeModuleAsyncOptions } from './types/stripe-module-async-options.interface'
import { StripeModuleOptions } from './types/stripe-module-options.interface'
import { StripeOptionsFactory } from './types/stripe-options-factory.interface'
import { StripeService } from './stripe.service'

// https://stackoverflow.com/questions/65704597/nestjs-nest-cant-resolve-dependencies-of-the-usersservice
// https://github.com/ssut/nestjs-sqs/blob/master/lib/sqs.module.ts

@Module({
  imports: [DiscoveryModule],
  providers: [StripeService, StripeWebhookService],
  exports: [StripeService, StripeWebhookService],
})
export class StripeModule {
  static register(options: StripeModuleOptions): DynamicModule {
    const stripeProvider = createStripeProvider(options)

    return {
      module: StripeModule,
      global: options.global ?? false,
      imports: [DiscoveryModule],
      // exports: [Stripe, StripeService, StripeWebhookService],
      exports: [StripeService, StripeWebhookService],
      providers: [stripeProvider, StripeService, StripeWebhookService],
    }
  }

  static registerAsync(options: StripeModuleAsyncOptions): DynamicModule {
    const stripeProvider: Provider = {
      // provide: Stripe,
      provide: STRIPE_CLIENT,
      inject: [STRIPE_MODULE_OPTIONS],
      useFactory: (stripeModuleOptions: StripeModuleOptions) => {
        return new Stripe(stripeModuleOptions.apiKey, stripeModuleOptions.stripeConfig)
      },
    }

    return {
      module: StripeModule,
      global: options.global ?? false,
      imports: [DiscoveryModule, ...(options.imports ?? [])],
      // exports: [Stripe, StripeService, StripeWebhookService],
      exports: [StripeService, StripeWebhookService],
      providers: [StripeService, StripeWebhookService, stripeProvider, ...this.createAsyncProviders(options)],
    }
  }

  private static createAsyncProviders(options: StripeModuleAsyncOptions): Array<Provider> {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)]
    }

    if (options.useClass) {
      return [
        this.createAsyncOptionsProvider(options),
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      ]
    }

    throw new Error('StripeModule async providers configuration error')
  }

  private static createAsyncOptionsProvider(options: StripeModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: STRIPE_MODULE_OPTIONS,
        inject: options.inject || [],
        useFactory: options.useFactory,
      }
    }

    if (options.useExisting) {
      return {
        provide: STRIPE_MODULE_OPTIONS,
        inject: [options.useExisting],
        useFactory: (optionsFactory: StripeOptionsFactory) => optionsFactory.createOptions(),
      }
    }

    if (options.useClass) {
      return {
        provide: STRIPE_MODULE_OPTIONS,
        inject: [options.useClass],
        useFactory: (optionsFactory: StripeOptionsFactory) => optionsFactory.createOptions(),
      }
    }

    throw new Error('StripeModule async configuration error')
  }
}
