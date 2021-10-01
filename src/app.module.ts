import { Module, RequestMethod } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'

import appConfig from './config/app.config'
import authConfig from './config/auth.config'
import awsConfig from './config/aws.config'

import { AuthModule } from './modules/auth/auth.module'
import { AwsModule } from './modules/aws/aws.module'
import { DatabaseModule } from './modules/database/database.module'
import { UiModule } from './modules/ui/ui.module'
import { UsersModule } from './modules/users/users.module'

import { AnyExceptionFilter } from './filters/any-exception.filter'

import { ThrottlerModule } from '@nestjs/throttler'
import { envFlagValue } from 'src/config/helpers'

/**
 * Configure the project's App Module.
 *
 * @see {@link https://docs.nestjs.com/techniques/configuration|NestJS Docs - Configuration}
 * @see {@link https://docs.nestjs.com/security/rate-limiting|NestJS Throttler Module}
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
    ...(envFlagValue(process.env.THROTTLE_ENABLED_FLAG)
      ? [
          ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              ttl: config.get('app.throttler').throttleTTL,
              limit: config.get('app.throttler').throttleLimit,
            }),
          }),
        ]
      : []),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AwsModule,
    UiModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: AnyExceptionFilter },
    ...(envFlagValue(process.env.THROTTLER_ENABLED_FLAG) ? [{ provide: APP_GUARD, useClass: ThrottlerModule }] : []),
  ],
})
export class AppModule {}
