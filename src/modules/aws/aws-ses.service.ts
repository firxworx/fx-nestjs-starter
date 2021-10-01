import { Injectable, Logger } from '@nestjs/common'
import {
  SESClient,
  SendEmailCommand,
  SendTemplatedEmailCommand,
  SendEmailCommandInput,
  SendEmailCommandOutput,
  SendTemplatedEmailCommandOutput,
} from '@aws-sdk/client-ses'
import { ConfigService } from '@nestjs/config'
import { getErrorStack } from '../../common/error-helpers'
import { AwsAbstractService } from './aws.abstract.service'

// basic implementation for aws ses send email using aws-sdk v3 client

// @see - https://docs.amazonaws.cn/en_us/sdk-for-javascript/v3/developer-guide/ses-examples-sending-email.html
// @see - https://github.com/awsdocs/aws-doc-sdk-examples/blob/master/javascriptv3/example_code/ses/src/ses_sendemail.js

@Injectable()
export class AwsSesService extends AwsAbstractService<SESClient> {
  protected readonly logger = new Logger(this.constructor.name)

  constructor(configService: ConfigService) {
    super(SESClient, configService)
  }

  private getTruncatedSubject(subject: string) {
    return `${subject.substr(0, 25)}${subject.length > 25 ? '...' : ''}`
  }

  private getBaseSendEmailParams(
    toEmail: Array<string> | string,
  ): Pick<SendEmailCommandInput, 'Destination' | 'Source' | 'ReplyToAddresses'> {
    const awsConfig = this.getAwsConfig()

    return {
      Destination: {
        ToAddresses: Array.isArray(toEmail) ? toEmail : [toEmail],
        // CcAddresses: [],
      },
      Source: awsConfig.ses?.senderAddress,
      ReplyToAddresses: [awsConfig.ses?.replyToAddress ?? ''],
    }
  }

  async sendEmail(
    toEmail: Array<string> | string,
    subject: string,
    plainBody: string,
    htmlBody?: string,
  ): Promise<SendEmailCommandOutput> {
    const params: SendEmailCommandInput = {
      ...this.getBaseSendEmailParams(toEmail),
      Message: {
        Body: {
          ...(plainBody
            ? {
                Text: {
                  Charset: 'UTF-8',
                  Data: plainBody,
                },
              }
            : {}),
          ...(htmlBody
            ? {
                Html: {
                  Charset: 'UTF-8',
                  Data: htmlBody,
                },
              }
            : {}),
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
    }

    const truncatedSubject = this.getTruncatedSubject(subject)

    try {
      const data = await this.client.send(new SendEmailCommand(params))

      this.logger.log(`Sent email to <${toEmail}> subject <${truncatedSubject}>`)

      return data
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send email to <${
          Array.isArray(toEmail) ? toEmail.join(', ') : toEmail
        }> subject <${truncatedSubject}>`,

        getErrorStack(error),
      )

      throw error
    }
  }

  async sendTemplatedEmail(
    toEmail: Array<string> | string,
    templateName: string,
    templateData: Record<string, string>,
  ): Promise<SendTemplatedEmailCommandOutput> {
    const params = {
      ...this.getBaseSendEmailParams(toEmail),
      Template: templateName,
      TemplateData: JSON.stringify(templateData), // data format e.g. '{ "REPLACEMENT_TAG_NAME":"REPLACEMENT_VALUE" }',
    }

    try {
      const data = await this.client.send(new SendTemplatedEmailCommand(params))
      this.logger.log(`Sent templated email to <${toEmail}> using template <${templateName}>`)

      return data
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send templated email to <${
          Array.isArray(toEmail) ? toEmail.join(', ') : toEmail
        }> using template <${templateName}>`,
        error instanceof Error ? error.stack : undefined,
      )

      throw error
    }
  }
}
