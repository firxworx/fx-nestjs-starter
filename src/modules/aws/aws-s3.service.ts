import { GetObjectCommand, ListBucketsCommand, S3Client } from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AwsConfig } from '../../config/aws.config'
import { Readable } from 'stream'

@Injectable()
export class AwsS3Service {
  private readonly logger = new Logger(this.constructor.name)

  private client: S3Client

  constructor(private readonly configService: ConfigService) {
    this.client = this.getS3Client()
  }

  private getAwsConfig() {
    const awsConfig = this.configService.get<AwsConfig>('aws')

    if (!awsConfig) {
      throw new Error('Failed to resolve AWS config')
    }

    return awsConfig
  }

  private getRequestHandler() {
    return new NodeHttpHandler({
      connectionTimeout: 1000,
      socketTimeout: 10000,
    })
  }

  private getS3Client() {
    const awsConfig = this.getAwsConfig()
    return new S3Client({
      region: awsConfig.region,
      ...awsConfig.credentials,
      // getRequestHandler
      // logger: console,
    })
  }

  async convertStreamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = []
      stream.setEncoding('utf-8')
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('error', reject)
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    })
  }

  async listBucket() {
    try {
      const data = await this.client.send(new ListBucketsCommand({}))
      this.logger.log('Success listing bucket')
      console.log('Success', data.Buckets)

      return data // return supports unit tests
    } catch (err) {
      console.error('Error', err)
    }
  }

  async getObject(bucketName: string, key: string, expiresIn: number) {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key })
    return getSignedUrl(this.client, command, { expiresIn })
  }

  async getObjectData(bucketName: string, key: string) {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key })
    const output = await this.client.send(command)

    return this.convertStreamToString(output.Body as Readable)
  }
}
