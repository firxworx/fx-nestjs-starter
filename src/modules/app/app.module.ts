import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import appConfig from 'src/config/app.config'
import authConfig from 'src/config/auth.config'
import awsConfig from 'src/config/aws.config'
import { AuthModule } from '../auth/auth.module'
import { AwsModule } from '../aws/aws.module'

import { DatabaseModule } from '../database/database.module'
import { UiModule } from '../ui/ui.module'
import { UsersModule } from '../users/users.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    // @see - https://docs.nestjs.com/techniques/configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, awsConfig],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AwsModule,
    UiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
