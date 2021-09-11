import { Module, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'

import appConfig from '../../config/app.config'
import authConfig from '../../config/auth.config'
import awsConfig from '../../config/aws.config'

import { AuthModule } from '../auth/auth.module'
import { AwsModule } from '../aws/aws.module'
import { DatabaseModule } from '../database/database.module'
import { UiModule } from '../ui/ui.module'
import { UsersModule } from '../users/users.module'

import { AnyExceptionFilter } from '../../filters/any-exception.filter'

import { AppController } from './app.controller'
import { AppService } from './app.service'

/**
 * Configure the project's App Module.
 *
 * @see {@link https://docs.nestjs.com/techniques/configuration|NestJS Docs - Configuration}
 * @see {@link https://github.com/iamolegga/nestjs-pino#configuration|nestjs-pino docs (configuration)}
 * @see {@link https://github.com/pinojs/pino-http#pinohttpopts-stream|pino-http options}
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, awsConfig],
    }),
    LoggerModule.forRoot({
      pinoHttp: [
        {
          level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
          prettyPrint: process.env.NODE_ENV !== 'production', // this option requires the pino-pretty package
          // useLevelLabels: true, // deprecated - use the formatters.level option instead
        },
      ],
      exclude: [{ method: RequestMethod.ALL, path: 'healthcheck' }], // do not log healthcheck requests (healthcheck tbd)
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AwsModule,
    UiModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: AnyExceptionFilter }],
})
export class AppModule {}
