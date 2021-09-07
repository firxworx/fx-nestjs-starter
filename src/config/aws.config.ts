import { registerAs } from '@nestjs/config'

export interface AwsConfig {
  region: string
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  ses: {
    senderAddress: string
    replyToAddress: string
  }
}

export default registerAs('aws', (): AwsConfig => {
  return {
    region: process.env.AWS_REGION ?? '',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
    ses: {
      senderAddress: process.env.AWS_SES_SENDER_ADDRESS ?? '',
      replyToAddress: process.env.AWS_SES_REPLY_TO_ADDRESS ?? process.env.AWS_SES_FROM_ADDRESS ?? '',
    },
  }
})
