import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TerminusModule } from '@nestjs/terminus'
import { DatabaseModule } from '../database/database.module'
import { HealthCheckController } from './health-check.controller'

/**
 * Module implements a health check powered by terminus via `@nestjs/terminus`.
 *
 * Refer to AppConfig `healthCheck` property + associated environment variables for module options.
 */
@Module({
  imports: [ConfigModule, TerminusModule, DatabaseModule],
  controllers: [HealthCheckController],
  providers: [],
})
export class HealthCheckModule {}
