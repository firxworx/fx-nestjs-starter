import { StripeConfig } from './stripe-config.interface'

export interface StripeModuleOptions extends StripeConfig {
  global?: boolean
}
