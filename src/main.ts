import { NestFactory, Reflector } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import {
  ClassSerializerInterceptor,
  HttpStatus,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common' // Logger
import type { NestExpressApplication } from '@nestjs/platform-express'
import { SwaggerModule, DocumentBuilder, SwaggerDocumentOptions, ExpressSwaggerCustomOptions } from '@nestjs/swagger'

import { Logger } from 'nestjs-pino'
import helmet from 'helmet'
import * as cookieParser from 'cookie-parser'
import compression from 'compression'

import { AppModule } from './app.module'
import type { AppConfig } from './config/app.config'
import { useContainer } from 'class-validator'

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

  // the default logger fro @nestjs/common is replaced by nestjs-pino
  // const logger = new Logger('main')

  // nestjs-pino is an idiomatic nestjs logger powered by pino that supports a json log format
  const logger = app.get(Logger)
  app.useLogger(logger)

  const configService = app.get<ConfigService>(ConfigService)
  const appConfig = configService.get<AppConfig>('app')

  if (!appConfig) {
    throw new Error('Error resolving app config (undefined)')
  }

  // the global prefix value does not begin with a slash so it is removed via regex from the basePath (as obtained from env or `src/config/defaults`) if present
  const globalPrefixValue = `${appConfig.basePath.replace(/^\/+/, '')}/${appConfig.apiVersion}`
  app.setGlobalPrefix(globalPrefixValue)

  // @starter set openapi/swagger title, description, version, etc. @see - https://docs.nestjs.com/openapi/introduction
  // important - cookies are not supported by the browser UI 'Try it Out' feature, though they are supported when published to https://app.swaggerhub.com/search
  if (appConfig.openApiDocs.enabled) {
    logger.log('Enabling swagger')

    const openApiConfig = new DocumentBuilder()
      .setTitle(appConfig.openApiDocs.title)
      .setDescription(appConfig.openApiDocs.description)
      .setVersion(appConfig.openApiDocs.version)
      .addCookieAuth('Authorization', {
        name: 'Authorization',
        description: 'Authorization token (JWT)',
        type: 'apiKey',
        // in: 'header',
      })
      // .addCookieAuth('Refresh', {
      //   name: 'Refresh',
      //   description: 'Refresh token (JWT)',
      //   type: 'apiKey',
      // })
      .addBasicAuth()
      // .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'accessToken') // for reference if auth header support is implemented
      .build()

    const openApiDocumentOptions: SwaggerDocumentOptions = {}

    // @see https://docs.nestjs.com/openapi/introduction - set custom css, js, favicon, url, etc.
    const openApiExpressCustomOptions: ExpressSwaggerCustomOptions = {
      // @see https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/
      swaggerOptions: {
        // @starter - Swagger/OpenAPI - persist authorization data so that it is not lost on browser close/refresh
        persistAuthorization: true,
        // @starter - Swagger/OpenAPI - empty array disables the Try It Out feature. Or, list http methods (lowercase) that have Swagger Try It Out editor enabled. Delete the following property entirely to support all methods by default.
        supportedSubmitMethods: [],
        // @starter - Swagger/OpenAPI - when true (default is false), enables passing credentials per fetch() in CORS requests sent by the browser (with caveat that swagger UI cannot set cross-domain cookies)
        withCredentials: false,
        // include cookie credentials in request (this function intercepts remote definition, 'Try it Out', and OAuth 2.0 requests)
        requestInterceptor: (req: { credentials: string }) => {
          req.credentials = 'include'
          return req
        },
      },
    }

    const openApiDocument = SwaggerModule.createDocument(app, openApiConfig, openApiDocumentOptions)
    SwaggerModule.setup('api', app, openApiDocument, openApiExpressCustomOptions)
  }

  // enable class-validator to use classes via NestJS direct injection (DI) - @see https://github.com/nestjs/nest/issues/528
  useContainer(app.select(AppModule), { fallback: true }) // fallbackOnErrors: true

  // @starter - consider nestjs versioning feature - this is an alternative to using the global prefix to apply an app-wide version
  // this feature enables controller-and-route-specific versioning - @see https://docs.nestjs.com/techniques/versioning
  // app.enableVersioning({
  //   type: VersioningType.URI,
  // })

  // ensure the `onApplicationShutdown()` functions of providers are called if process receives a shutdown signal
  app.enableShutdownHooks()

  // @starter - consider if ClassSerializerInterceptor should be globally enabled or not
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  // @starter - review global ValidationPipe's ValidatorOptions
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip validated object of properties that do not have validation decorators in the entity/dto
      transform: true, // enable class-transformer to transform plain objects into classes via `plainToClass()`; use in conjuction with `@Type()` decorator
      transformOptions: {
        enableImplicitConversion: false,
      },
      forbidNonWhitelisted: true, // throw if an unrecognized (non-decorated) property is received
      // disableErrorMessages: true, // or make env config option - may want to disable verbose errors in production
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

  // SpelunkerModule.explore(app)

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
