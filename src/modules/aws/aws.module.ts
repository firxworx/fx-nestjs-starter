import { Module } from '@nestjs/common'
import { AwsSesService } from './aws-ses.service'
import { AwsS3Service } from './aws-s3.service'
import { AwsEventBridgeService } from './aws-eventbridge.service'
import { AwsSnsService } from './aws-sns.service'

@Module({
  providers: [AwsSesService, AwsS3Service, AwsSnsService, AwsEventBridgeService],
  exports: [AwsSesService, AwsS3Service, AwsSnsService, AwsEventBridgeService],
})
export class AwsModule {}
