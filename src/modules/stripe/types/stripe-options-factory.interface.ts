import { StripeModuleOptions } from './stripe-module-options.interface'

export interface StripeOptionsFactory {
  createOptions: () => Promise<StripeModuleOptions> | StripeModuleOptions
}
