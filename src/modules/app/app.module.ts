import { Module, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'

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
    // @see - https://github.com/iamolegga/nestjs-pino#configuration
    LoggerModule.forRoot({
      pinoHttp: [
        {
          level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
          prettyPrint: process.env.NODE_ENV !== 'production', // uses pino-pretty package
          // useLevelLabels: true, // deprecated - use the formatters.level option instead
        },
      ],
      exclude: [{ method: RequestMethod.ALL, path: 'health' }],
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
