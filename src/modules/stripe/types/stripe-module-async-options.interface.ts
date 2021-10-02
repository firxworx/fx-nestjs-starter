import { ModuleMetadata, Type } from '@nestjs/common'
import { StripeModuleOptions } from './stripe-module-options.interface'
import { StripeOptionsFactory } from './stripe-options-factory.interface'

export interface StripeModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  // inject?: Array<Type<any> | string | symbol | Abstract<any> | Function>
  global?: boolean
  inject?: Array<any>
  useClass?: Type<StripeOptionsFactory>
  useExisting?: Type<StripeOptionsFactory>
  useFactory?: (...args: any[]) => Promise<StripeModuleOptions> | StripeModuleOptions
}
