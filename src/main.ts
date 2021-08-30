import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { Logger, ValidationPipe } from '@nestjs/common'

import { AppModule } from './modules/app/app.module'
import { AppConfig } from './config/app.config'

/**
 * Bootstrap the NestJS app.
 *
 * @starter review main.ts for logger, global prefix, global pipes/filters/etc.
 */
async function bootstrap() {
  const logger = new Logger('main')

  const app = await NestFactory.create(AppModule, {
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

  app.enableShutdownHooks()

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // forbidNonWhitelisted: true,
    }),
  )

  await app.listen(appConfig.port, () => {
    logger.log(`😎 Application listening on port <${appConfig.port}> at path: ${globalPrefixValue}`)
  })
}

bootstrap()
