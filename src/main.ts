import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { HttpStatus, UnprocessableEntityException, ValidationError, ValidationPipe } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { SwaggerModule, DocumentBuilder, SwaggerDocumentOptions, ExpressSwaggerCustomOptions } from '@nestjs/swagger'

import { Logger } from 'nestjs-pino'
import helmet from 'helmet'
import * as cookieParser from 'cookie-parser'
import compression from 'compression'

import { AppModule } from './modules/app/app.module'
import type { AppConfig } from './config/app.config'

/**
 * Bootstrap the NestJS app.
 *
 * @starter review main.ts for logger, global prefix, global pipes/filters/etc.
 * @see AppModule for additional global `imports` and `providers`
 */
async function bootstrap(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true, // refer to nestjs-pino readme
  })

  // nestjs-pino + pino provide an idiomatic nestjs logger that supports json log format
  const logger = app.get(Logger)
  app.useLogger(logger)

  const configService = app.get<ConfigService>(ConfigService)
  const appConfig = configService.get<AppConfig>('app')

  if (!appConfig) {
    throw new Error('Error resolving app config (undefined)')
  }

  // @starter set openapi/swagger title, description, version, etc. @see - https://docs.nestjs.com/openapi/introduction
  if (appConfig.openApiDocs.enable) {
    logger.log('Enabling swagger')
    const openApiConfig = new DocumentBuilder()
      .setTitle('Project API')
      .setDescription('Desc')
      .setVersion('0.1.0')
      // .addTag('tagName')
      // .addBearerAuth()
      .build()

    const openApiDocumentOptions: SwaggerDocumentOptions = {}
    const openApiExpressCustomOptions: ExpressSwaggerCustomOptions = {
      swaggerOptions: {
        // persistAuthorization: true,
        // include cookie credentials in request
        requestInterceptor: (req: { credentials: string }) => {
          req.credentials = 'include'
          return req
        },
      },
    }

    const openApiDocument = SwaggerModule.createDocument(app, openApiConfig, openApiDocumentOptions)
    SwaggerModule.setup('api', app, openApiDocument, openApiExpressCustomOptions)
  }

  // the global prefix value does not begin with a slash so it is removed via regex from the basePath (as obtained from env or `src/config/defaults`) if present
  const globalPrefixValue = `${appConfig.basePath.replace(/^\/+/, '')}/${appConfig.apiVersion}`
  app.setGlobalPrefix(globalPrefixValue)

  // @starter - the versioning feature is an alternative to using the global prefix to apply an app-wide version
  // it enables controller-and-route-specific versioning - @see https://docs.nestjs.com/techniques/versioning
  //
  // app.enableVersioning({
  //   type: VersioningType.URI,
  // })

  // ensure the `onApplicationShutdown()` functions of providers are called if process receives a shutdown signal
  app.enableShutdownHooks()

  // app.useGlobalInterceptors(new SerializerInterceptor())

  // use global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // forbidNonWhitelisted: true,
      // disableErrorMessages: true, // or make env config option
      // transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY, // 422
      exceptionFactory: (errors: ValidationError[]) =>
        new UnprocessableEntityException({
          message: 'Unprocessable Entity',
          errors: errors.reduce(
            (acc, curr) => ({
              ...acc,
              [curr.property]: Object.values(curr.constraints ?? {}).join(', '),
            }),
            {},
          ),
        }),
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

  // conditionally use compression (express middleware) per app config
  if (appConfig.express.compression) {
    app.use(compression())
  }

  // conditionally trust proxy (trust X-Forwarded-* headers)
  if (appConfig.express.trustProxy) {
    app.enable('trust proxy')
  }

  // use helmet to set common security-related http headers
  app.use(helmet())

  const httpServer = await app.listen(appConfig.port, () => {
    logger.log(`🚀 Application environment: <${process.env.NODE_ENV}>`)
    logger.log(`🚀 Application listening on port <${appConfig.port}> at path <${globalPrefixValue}>`)
    logger.log(`🚀 Accepting requests from origin: <${appConfig.origin}>`)
  })

  const url = await app.getUrl()
  logger.log(`🚀 Application URL: <${url}>`)

  return httpServer
}

bootstrap().catch((error) => console.error(error))
