import {
  // ListTopicsCommandInput,
  PublishCommand,
  PublishCommandInput,
  PublishCommandOutput,
  SNSClient,
} from '@aws-sdk/client-sns'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AwsAbstractService } from './aws.abstract.service'

@Injectable()
export class AwsSnsService extends AwsAbstractService<SNSClient> {
  protected readonly logger = new Logger(this.constructor.name)

  protected client: SNSClient

  constructor(configService: ConfigService) {
    super(configService)
    this.client = this.getClient(SNSClient)
  }

  // 	async onModuleInit() {

  // public async listTopics() {
  //   const params: ListTopicsCommandInput = {}
  // }

  // public async createTopics() {}

  /**
   * Publish an SNS message to a topic.
   *
   * @param topicArn
   * @param message string or object (objects will be stringified via JSON.stringify())
   */
  public async publishToTopic(
    topicArn: string,
    message: string | Record<string, unknown>,
  ): Promise<PublishCommandOutput> {
    const params: PublishCommandInput = {
      TopicArn: topicArn,
      Message: typeof message === 'object' ? JSON.stringify(message) : message,
    }

    try {
      const data = await this.client.send(new PublishCommand(params))

      return data // unit tests
    } catch (error: unknown) {
      const tsError = error instanceof Error ? error : undefined
      this.logger.error(tsError ? tsError.message : String(error), tsError?.stack)

      return Promise.reject(error)
    }
  }

  /**
   * Publish an SNS message to a phone number as an SMS message.
   *
   * @param phoneNUmber
   * @param message text message
   */
  public async publishToPhoneNumber(
    phoneNumber: string,
    message: string,
    otherParams?: Omit<PublishCommandInput, 'PhoneNumber' | 'Message'>,
  ): Promise<PublishCommandOutput> {
    const params: PublishCommandInput = {
      PhoneNumber: phoneNumber,
      Message: message,
      ...(otherParams ? otherParams : {}),
    }

    try {
      const data = await this.client.send(new PublishCommand(params))
      return data
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }
}
