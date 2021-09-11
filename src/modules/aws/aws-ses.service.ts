import { Injectable, Logger } from '@nestjs/common'
import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from '@aws-sdk/client-ses'
import { ConfigService } from '@nestjs/config'
import { AwsConfig } from '../../config/aws.config'
import { getErrorStack } from '../../common/error-helpers'

// basic implementation for aws ses send email using aws-sdk v3 client

// @see - https://docs.amazonaws.cn/en_us/sdk-for-javascript/v3/developer-guide/ses-examples-sending-email.html
// @see - https://github.com/awsdocs/aws-doc-sdk-examples/blob/master/javascriptv3/example_code/ses/src/ses_sendemail.js

@Injectable()
export class AwsSesService {
  private readonly logger = new Logger(this.constructor.name)

  private client: SESClient

  constructor(private readonly configService: ConfigService) {
    this.client = this.getSESClient()
  }

  private getAwsConfig() {
    const awsConfig = this.configService.get<AwsConfig>('aws')

    if (!awsConfig) {
      throw new Error('Failed to resolve AWS config')
    }

    return awsConfig
  }

  private getSESClient() {
    const awsConfig = this.getAwsConfig()
    return new SESClient({ region: awsConfig.region, ...awsConfig.credentials })
  }

  private getBaseSendEmailParams(toEmail: Array<string> | string) {
    const awsConfig = this.getAwsConfig()

    return {
      Destination: {
        ToAddresses: Array.isArray(toEmail) ? toEmail : [toEmail],
        // CcAddresses: [],
      },
      Source: awsConfig.ses.senderAddress,
      ReplyToAddresses: [awsConfig.ses.replyToAddress],
    }
  }

  async sendEmail(toEmail: Array<string> | string, subject: string, plainBody: string, htmlBody?: string) {
    const params = {
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

    try {
      const data = await this.client.send(new SendEmailCommand(params))
      this.logger.log(
        `Sent email to <${toEmail}> with subject <${subject.substr(0, 25)}${subject.length > 25 ? '...' : ''}>`,
      )

      return data // return supports unit tests
    } catch (error) {
      this.logger.error(
        `Failed to send email via aws-ses to <${
          Array.isArray(toEmail) ? toEmail.join(', ') : toEmail
        }> with subject <${subject}>`,
        getErrorStack(error),
      )

      throw error
    }
  }

  async sendTemplatedEmail(
    toEmail: Array<string> | string,
    templateName: string,
    templateData: Record<string, string>,
  ) {
    const params = {
      ...this.getBaseSendEmailParams(toEmail),
      Template: templateName,
      TemplateData: JSON.stringify(templateData), // e.g. '{ "REPLACEMENT_TAG_NAME":"REPLACEMENT_VALUE" }',
    }

    try {
      const data = await this.client.send(new SendTemplatedEmailCommand(params))
      this.logger.log(`Sent templated email to <${toEmail}> with template <${templateName}>`)

      return data // return supports unit tests
    } catch (error) {
      this.logger.error(
        `Failed to send templated email via aws-ses to <${
          Array.isArray(toEmail) ? toEmail.join(', ') : toEmail
        }> with template <${templateName}>`,
        getErrorStack(error),
      )

      throw error
    }
  }
}
