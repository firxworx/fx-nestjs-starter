import { Controller, Get } from '@nestjs/common'
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorFunction,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus'
import type { HealthCheckResult } from '@nestjs/terminus'
import { ApiExcludeController } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'

import { AppConfig } from 'src/config/app.config'
import { PublicRouteHandler } from '../auth/decorators/public-route-handler.decorator'

@ApiExcludeController()
@Controller('health')
export class HealthCheckController {
  constructor(
    private configService: ConfigService,
    private healthCheckService: HealthCheckService,
    private httpHealthIndicator: HttpHealthIndicator,
    private memoryHealthIndicator: MemoryHealthIndicator,
    private typeormHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  @PublicRouteHandler()
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    const healthCheckConfig = this.configService.get<AppConfig>('app')?.healthCheck

    if (!healthCheckConfig) {
      throw new Error('Error resolving health check config')
    }

    const healthChecks: Array<HealthIndicatorFunction> = [
      async () => this.typeormHealthIndicator.pingCheck('database', { timeout: 1500 }),
    ]

    if (typeof healthCheckConfig.httpPingUrl === 'string') {
      healthChecks.push(async () =>
        this.httpHealthIndicator.pingCheck('httpPing', healthCheckConfig.httpPingUrl as string),
      )
    }

    if (typeof healthCheckConfig.maxHeapMiB === 'number') {
      healthChecks.push(async () =>
        this.memoryHealthIndicator.checkHeap('memoryHeap', (healthCheckConfig.maxHeapMiB as number) * 1024 * 1024),
      )
    }

    if (typeof healthCheckConfig.maxRssMiB === 'number') {
      healthChecks.push(async () =>
        this.memoryHealthIndicator.checkRSS('memoryRss', (healthCheckConfig.maxRssMiB as number) * 1024 * 1024),
      )
    }

    return this.healthCheckService.check(healthChecks)
  }
}
