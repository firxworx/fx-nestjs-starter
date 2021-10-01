import {
  EventBridgeClient,
  PutEventsCommand,
  PutEventsRequestEntry,
  PutEventsCommandOutput,
} from '@aws-sdk/client-eventbridge'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AwsAbstractService } from './aws.abstract.service'

@Injectable()
export class AwsEventBridgeService extends AwsAbstractService<EventBridgeClient> {
  protected readonly logger = new Logger(this.constructor.name)

  constructor(configService: ConfigService) {
    super(EventBridgeClient, configService)
  }

  // 	async onModuleInit() {

  /**
   * Return a `PutEventsRequestEntry` object built using the current time that includes the given arguments.
   *
   * @param eventBusName
   * @param source identifier for service generating the event. AWS recommends Java package-name style reverse-domain-name strings (e.g. 'com.companydomain.myapp'). Source cannot begin with reserved 'aws'.
   * @param detailType indentifier that in combination with `source` is associated with the fields and values included in the `detail` field
   * @param detail object containing details about the event
   * @param resources array of ARNs that identify resources involved with the event
   * @returns
   *
   * @see https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-putevents.html
   */
  public createPutEventsRequestEntry(
    eventBusName: string,
    source: string,
    detailType: string,
    detail: Record<string, unknown>,
    resources?: Array<string>,
    otherParams?: Record<string, unknown>,
  ): PutEventsRequestEntry {
    return {
      Time: new Date(),
      EventBusName: eventBusName,
      Source: source,
      DetailType: detailType,
      Detail: JSON.stringify(detail),
      ...(resources ? { Resources: resources } : {}),
      ...(otherParams ? { otherParams } : {}), // e.g. add `TraceHeader` or to override above properties
    }
  }

  /**
   * Return the event size in bytes of the given `PutEventsRequestEntry` using the formula documented by AWS
   * for EventBridge.
   *
   * This helper function is implemented to help meet AWS' requirement that an event's total entry size must be
   * less than 256KB.
   *
   * If an entry size larger than 256KB is required, AWS recommends putting the event in an Amazon S3 object
   * and including a link to that object in the PutEvents entry.
   *
   * @param entry
   * @returns
   *
   * @see https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-putevent-size.html
   */
  public getEventSize(entry: PutEventsRequestEntry): number {
    return (
      (entry.Time ? 14 : 0) +
      Buffer.byteLength(entry.Source ?? '', 'utf8') +
      Buffer.byteLength(entry.DetailType ?? '', 'utf8') +
      (entry.Detail ? Buffer.byteLength(entry.Detail ?? '', 'utf8') : 0) +
      (Array.isArray(entry.Resources)
        ? entry.Resources.reduce((acc, curr) => acc + Buffer.byteLength(curr ?? '', 'utf8'), 0)
        : 0)
    )
  }

  /**
   * Put an array of events onto an event bus.
   *
   * The total event size must be less than 256KB. If an event size is required to be larger than 256KB, AWS recommends
   * putting the event in an Amazon S3 object and including a link to that object in the PutEvents entry.
   *
   * @param entries
   * @returns
   *
   * @see createPutEventsRequestEntry
   * @see getEventSize
   * @see https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-putevents.html
   * @see https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-putevent-size.html
   */
  public async putEvents(entries?: Array<PutEventsRequestEntry>): Promise<PutEventsCommandOutput> {
    try {
      const data = await this.client.send(new PutEventsCommand({ Entries: entries }))

      return data // for unit tests
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }
}
