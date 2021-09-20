import { Logger } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'
import { AwsConfig } from './types/aws.config.interface'

export abstract class AwsAbstractService<AwsClient> {
  protected abstract readonly logger: Logger
  protected client: AwsClient

  protected constructor(
    private readonly ClientClass: { new (...args: any[]): AwsClient },
    private readonly configService: ConfigService,
  ) {
    this.client = this.getClient()
  }

  protected getAwsConfig() {
    const awsConfig = this.configService.get<AwsConfig>('aws')

    if (!awsConfig) {
      throw new Error('Failed to resolve AWS config')
    }

    return awsConfig
  }

  /**
   * Initialize (or re-initialize if called from child class) the protected `client` property.
   *
   * @starter the aws client configuration object supports a `logger` prop (e.g. `logger: console`)
   * refer to aws sdk docs for required interface if you would like to specify your own logger here.
   *
   * @param optionalConfig
   * @returns
   */
  protected getClient(optionalConfig?: Record<string, unknown>): AwsClient {
    const awsConfig = this.getAwsConfig()

    this.client = new this.ClientClass({
      region: awsConfig.region,
      credentials: awsConfig.credentials,
      ...(optionalConfig ? optionalConfig : {}),
      // logger: console,
    })

    return this.client
  }

  /**
   * Log the given error and return a rejected promise with the original error.
   *
   * @param error
   * @returns rejected promise containing the original error
   */
  protected handleError(error: unknown) {
    const tsError = error instanceof Error ? error : undefined
    this.logger.error(tsError ? tsError.message : String(error), tsError?.stack)

    return Promise.reject(error)
  }
}
