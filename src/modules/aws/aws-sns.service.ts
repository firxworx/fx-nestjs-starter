import {
  ConfirmSubscriptionCommand,
  ConfirmSubscriptionCommandOutput,
  CreateTopicCommand,
  CreateTopicCommandInput,
  CreateTopicCommandOutput,
  DeleteTopicCommand,
  DeleteTopicCommandOutput,
  ListSubscriptionsByTopicCommand,
  ListSubscriptionsByTopicCommandOutput,
  ListTopicsCommand,
  ListTopicsCommandOutput,
  PublishCommand,
  PublishCommandInput,
  PublishCommandOutput,
  SNSClient,
  SubscribeCommand,
  SubscribeCommandInput,
  SubscribeCommandOutput,
  UnsubscribeCommand,
  UnsubscribeCommandInput,
  UnsubscribeCommandOutput,
} from '@aws-sdk/client-sns'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AwsAbstractService } from './aws.abstract.service'

@Injectable()
export class AwsSnsService extends AwsAbstractService<SNSClient> {
  protected readonly logger = new Logger(this.constructor.name)

  constructor(configService: ConfigService) {
    super(SNSClient, configService)
  }

  // 	async onModuleInit() {

  /**
   * Return a list of SNS tokens.
   *
   * @param nextToken
   * @returns
   */
  public async listTopics(nextToken?: string): Promise<ListTopicsCommandOutput> {
    try {
      const data = await this.client.send(new ListTopicsCommand({ NextToken: nextToken }))

      return data // for unit tests
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  // @todo setTopicAttributes

  /**
   * Create an SNS topic with the given name.
   *
   * @param topicName
   * @param otherParams
   * @returns
   */
  public async createTopics(
    topicName: string,
    otherParams: Omit<CreateTopicCommandInput, 'Name'>,
  ): Promise<CreateTopicCommandOutput> {
    try {
      const data = await this.client.send(
        new CreateTopicCommand({ Name: topicName, ...(otherParams ? otherParams : {}) }),
      )

      return data // for unit tests
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  /**
   * Delete the SNS topic at the given AWS ARN (Amazon Resource Name).
   *
   * @param topicName
   * @param otherParams
   * @returns
   */
  public async deleteTopics(topicArn: string): Promise<DeleteTopicCommandOutput> {
    try {
      const data = await this.client.send(new DeleteTopicCommand({ TopicArn: topicArn }))

      return data // for unit tests
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  /**
   * Publish an SNS message to a topic.
   *
   * @param topicArn
   * @param message string or object (if an object the Message will be processed by JSON.stringify())
   */
  public async publishToTopic(
    topicArn: string,
    message: string | Record<string, unknown>,
    otherParams: Omit<PublishCommandInput, 'TopicArn' | 'Message'>,
  ): Promise<PublishCommandOutput> {
    try {
      const data = await this.client.send(
        new PublishCommand({
          TopicArn: topicArn,
          Message: typeof message === 'object' ? JSON.stringify(message) : message,
          ...(otherParams ? otherParams : {}),
        }),
      )

      return data // unit tests
    } catch (error: unknown) {
      return this.handleError(error)
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
    try {
      const data = await this.client.send(
        new PublishCommand({ PhoneNumber: phoneNumber, Message: message, ...(otherParams ? otherParams : {}) }),
      )
      return data
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  public async listTopicSubscriptions(topicArn: string): Promise<ListSubscriptionsByTopicCommandOutput> {
    try {
      const data = await this.client.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }))
      return data // for unit tests
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Subscribe to an endpoint.
   *
   * Endpoints can be:
   * - email (`protocol: 'email'`) - `endpoint` is an email address
   * - lambdas (`protocol: 'lambda'`) - `endpointArn` is a lambda ARN
   * - application endpoints (`protocol: 'application'`) - `endpointArn` is a mobile endpoint ARN
   *
   * @todo https://docs.aws.amazon.com/sns/latest/dg/sns-fork-pipeline-as-subscriber.html
   * */
  public async subscribeToTopic(
    protocol: 'email' | 'lambda' | 'application',
    topicArn: string,
    endpoint: string,
    returnSubsriptionArn: boolean,
    otherParams?: Omit<SubscribeCommandInput, 'Protocol' | 'TopicArn' | 'Endpoint'>,
  ): Promise<SubscribeCommandOutput> {
    try {
      const data = await this.client.send(
        new SubscribeCommand({
          Protocol: protocol,
          TopicArn: topicArn,
          Endpoint: endpoint,
          ReturnSubscriptionArn: returnSubsriptionArn,
          ...(otherParams ? otherParams : {}),
        }),
      )

      return data // for unit tests
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Confirm an `Endpoint` subscriber/owner's subscription to a topic using a token that was
   * sent to them (e.g. email, etc) as triggered by a recent subscribe action.
   *
   * @param token
   * @param authenticateOnUnsubscribe
   * @returns
   */
  public async confirmSubscription(
    token: string,
    topicArn: string,
    authenticateOnUnsubscribe: boolean,
  ): Promise<ConfirmSubscriptionCommandOutput> {
    try {
      const data = await this.client.send(
        new ConfirmSubscriptionCommand({
          Token: token,
          TopicArn: topicArn,
          AuthenticateOnUnsubscribe: authenticateOnUnsubscribe ? 'true' : 'false',
        }),
      )

      return data // for unit tests
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Unsubscribe from a topic.
   *
   * @param subscriptionArn
   * @param otherParams
   * @returns
   */
  public async unsubscribeFromTopic(
    subscriptionArn: string,
    otherParams?: Omit<UnsubscribeCommandInput, 'SubscriptionArn'>,
  ): Promise<UnsubscribeCommandOutput> {
    try {
      const data = await this.client.send(
        new UnsubscribeCommand({ SubscriptionArn: subscriptionArn, ...(otherParams ? otherParams : {}) }),
      )

      return data // for unit tests
    } catch (error) {
      return this.handleError(error)
    }
  }
}
