import { Module } from '@nestjs/common'
import { AwsSesService } from './aws-ses.service'
import { AwsS3Service } from './aws-s3.service'

@Module({
  providers: [AwsSesService, AwsS3Service],
  exports: [AwsSesService, AwsS3Service],
})
export class AwsModule {}
