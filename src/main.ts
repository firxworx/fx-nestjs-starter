import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { Logger, ValidationPipe } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'

import helmet from 'helmet'
import * as cookieParser from 'cookie-parser'

import { AppModule } from './modules/app/app.module'
import { AppConfig } from './config/app.config'
import { AnyExceptionFilter } from './filters/any-exception.filter'

/**
 * Bootstrap the NestJS app.
 *
 * @starter review main.ts for logger, global prefix, global pipes/filters/etc.
 * @see AppModule for additional global `imports` and `providers`
 */
async function bootstrap(): Promise<NestExpressApplication> {
  const logger = new Logger('main')

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'development' ? ['log', 'debug', 'error', 'verbose', 'warn'] : ['log', 'error', 'warn'],
  })

  const configService = app.get<ConfigService>(ConfigService)
  const appConfig = configService.get<AppConfig>('app')

  if (!appConfig) {
    throw new Error('Error resolving app config (undefined)')
  }

  // the global prefix value does not begin with a slash so it is removed via regex from the basePath (as obtained from env or `src/config/defaults`) if present
  const globalPrefixValue = `${appConfig.basePath.replace(/^\/+/, '')}/${appConfig.apiVersion}`
  app.setGlobalPrefix(globalPrefixValue)

  // ensure the `onApplicationShutdown()` functions of providers are called if process receives a shutdown signal
  app.enableShutdownHooks()

  // use global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // forbidNonWhitelisted: true,
    }),
  )

  // enable cors for this api based on app config
  app.enableCors({
    origin: appConfig.origin,
    credentials: true, // support auth cookies
    // methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    // allowedHeaders: ...
  })

  // use cookie-parser express middleware to populate `req.cookies`
  app.use(cookieParser.default())

  // use AnyExceptionFilter to log all unhandled exceptions and return a standardized json response format
  app.useGlobalFilters(new AnyExceptionFilter())

  // trust proxy to trust X-Forwarded-* headers (express specific)
  if (appConfig.express.trustProxy) {
    app.enable('trust proxy')
  }

  // use helmet for common security enhancements
  app.use(helmet())

  return app.listen(appConfig.port, () => {
    logger.log(`😎 Application listening on port <${appConfig.port}> at path <${globalPrefixValue}>`)
    logger.log(`😎 Accepting requests from origin: <${appConfig.origin}>`)
  })
}

bootstrap()
