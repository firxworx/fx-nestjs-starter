import { DynamicModule, Module, Provider } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'

import { STRIPE_CLIENT, STRIPE_MODULE_OPTIONS } from './stripe.constants'
import { StripeWebhookService } from './stripe-webhook.service'
import { createStripeClientProvider } from './stripe-client.provider'
import { StripeModuleAsyncOptions } from './types/stripe-module-async-options.interface'
import { StripeModuleOptions } from './types/stripe-module-options.interface'
import { StripeOptionsFactory } from './types/stripe-options-factory.interface'
import { StripeService } from './stripe.service'
import { ConfigModule } from '@nestjs/config'

@Module({})
export class StripeModule {
  public static register(options: StripeModuleOptions): DynamicModule {
    return {
      module: StripeModule,
      global: options.global ?? false,
      imports: [DiscoveryModule, ConfigModule],
      providers: [
        createStripeClientProvider(),
        { provide: STRIPE_MODULE_OPTIONS, useValue: options },
        StripeService,
        StripeWebhookService,
      ],
      exports: [StripeService, StripeWebhookService],
    }
  }

  public static registerAsync(options: StripeModuleAsyncOptions): DynamicModule {
    return {
      module: StripeModule,
      global: options.global ?? false,
      imports: [DiscoveryModule, ConfigModule, ...(options.imports ?? [])],
      providers: [
        createStripeClientProvider(),
        ...this.createAsyncProviders(options),
        StripeService,
        StripeWebhookService,
      ],
      exports: [StripeService, StripeWebhookService, STRIPE_CLIENT],
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

    if ((!options.useClass && !options.useExisting) || (options.useClass && options.useExisting)) {
      throw new Error('StripeModule async options configuration error')
    }

    return {
      provide: STRIPE_MODULE_OPTIONS,
      inject: [...(options.useExisting ? [options.useExisting] : []), ...(options.useClass ? [options.useClass] : [])],
      useFactory: (optionsFactory: StripeOptionsFactory) => optionsFactory.createOptions(),
    }
  }
}
