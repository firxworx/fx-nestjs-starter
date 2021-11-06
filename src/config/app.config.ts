import { registerAs } from '@nestjs/config'
import {
  DEFAULT_PORT,
  DEFAULT_API_VERSION,
  DEFAULT_BASE_PATH,
  DEFAULT_THROTTLER_LIMIT,
  DEFAULT_THROTTLER_TTL,
} from './defaults'
import { envFlagValue, envNumberValue } from './helpers'

export interface AppConfig {
  origin: string
  port: number
  basePath: string
  apiVersion: string
  express: {
    compression: boolean
    trustProxy: boolean
  }
  healthCheck: {
    /** healthcheck ping url to verify http connectivity (and dns if provided a url with domain name).  */
    httpPingUrl: string | false
    /** healthcheck threshold for max heap size in MiB.  */
    maxHeapMiB: number | false
    /** healthcheck threshold for max rss (resident set size) in MiB.  */
    maxRssMiB: number | false
  }
  /** Config for @nestjs/throttler. */
  throttler: {
    /** Enable the throttler powered by `@nestjs/throttler`. */
    enabled: boolean
    /** Number of seconds that each request is stored. */
    throttleTTL: number
    /** Number of requests within the TTL limit. */
    throttleLimit: number
  }
  openApiDocs: {
    enabled: boolean
    title: string
    description: string
    version: string
  }
}

/** Resolve the PORT for this API. */
const PORT = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT

/**
 * Return the CORS origin for this environment per `NODE_ENV`.
 *
 * Reminder: CORS + cookies requires a complete url that includes ports.
 *
 * @throws if process.env.ORIGIN is not defined when `NODE_ENV` production.
 */
const getOrigin = () => {
  if (process.env.NODE_ENV === 'development') {
    return process.env.ORIGIN ?? `http://localhost:${PORT}`
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ORIGIN) {
      throw new Error('ORIGIN environment variable must be defined in production')
    }

    return process.env.ORIGIN
  }

  // fallback to wildcard suitable for other potential use-cases in dev + test environments
  return '*'
}

const getExpressConfig = () => {
  const isProxyDeployMode = !!(process.env.DEVOPS_DEPLOY_MODE && process.env.DEVOPS_DEPLOY_MODE === 'proxy'
    ? true
    : false)

  return {
    express: {
      compression: !isProxyDeployMode,
      trustProxy: isProxyDeployMode,
    },
  }
}

export default registerAs('app', (): AppConfig => {
  return {
    origin: getOrigin(),
    port: PORT,
    basePath: process.env.BASE_PATH ?? DEFAULT_BASE_PATH,
    apiVersion: process.env.API_VERSION ?? DEFAULT_API_VERSION,
    ...getExpressConfig(),
    healthCheck: {
      httpPingUrl: process.env.HEALTH_CHECK_HTTP_PING_URL ?? false,
      maxHeapMiB: envNumberValue(process.env.HEALTH_CHECK_MAX_HEAP_MIB) ?? false,
      maxRssMiB: envNumberValue(process.env.HEALTH_CHECK_MAX_RSS_MIB) ?? false,
    },
    throttler: {
      enabled: envFlagValue(process.env.THROTTLER_ENABLED_FLAG),
      throttleTTL: process.env.THROTTLER_TTL ? Number(process.env.THROTTLER_TTL) : DEFAULT_THROTTLER_TTL,
      throttleLimit: process.env.THROTTLER_LIMIT ? Number(process.env.THROTTLER_LIMIT) : DEFAULT_THROTTLER_LIMIT,
    },
    openApiDocs: {
      enabled: envFlagValue(process.env.OPENAPI_ENABLED_FLAG),
      title: process.env.OPENAPI_TITLE ?? 'API',
      description: process.env.OPENAPI_DESCRIPTION ?? 'API Powered by NestJS',
      version: process.env.OPENAPI_VERSION ?? process.env.API_VERSION ?? '',
    },
  }
})
