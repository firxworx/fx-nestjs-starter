import { Logger } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'
import { AwsConfig } from './types/aws.config.interface'

export abstract class AwsAbstractService<AwsClient> {
  protected abstract readonly logger: Logger
  protected abstract client: AwsClient

  protected constructor(private readonly configService: ConfigService) {}

  protected getAwsConfig() {
    const awsConfig = this.configService.get<AwsConfig>('aws')

    if (!awsConfig) {
      throw new Error('Failed to resolve AWS config')
    }

    return awsConfig
  }

  protected getClient(
    ClientClass: { new (...args: any[]): AwsClient },
    optionalConfig?: Record<string, unknown>,
  ): AwsClient {
    const awsConfig = this.getAwsConfig()

    return new ClientClass({
      region: awsConfig.region,
      credentials: awsConfig.credentials,
      ...(optionalConfig ? optionalConfig : {}),
      // logger: console,
    })
  }

  protected handleError(error: unknown) {
    const tsError = error instanceof Error ? error : undefined
    this.logger.error(tsError ? tsError.message : String(error), tsError?.stack)

    return Promise.reject(error)
  }
}
