import { registerAs } from '@nestjs/config'
import {
  DEFAULT_PORT,
  DEFAULT_API_VERSION,
  DEFAULT_BASE_PATH,
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL,
} from './defaults'

export interface AppConfig {
  origin: string
  port: number
  basePath: string
  apiVersion: string
  throttleTTL: number
  throttleLimit: number
  express: {
    compression: boolean
    trustProxy: boolean
  }
  openApiDocs: {
    enabled: boolean
  }
}

/** Resolve the PORT for this API. */
const PORT = process.env.PORT ? +process.env.PORT : DEFAULT_PORT

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
    throttleTTL: process.env.THROTTLE_TTL ? +process.env.THROTTLE_TTL : DEFAULT_THROTTLE_TTL,
    throttleLimit: process.env.THROTTLE_LIMIT ? +process.env.THROTTLE_LIMIT : DEFAULT_THROTTLE_LIMIT,
    ...getExpressConfig(),
    openApiDocs: {
      enabled: Number(process.env.OPENAPI_ENABLED_FLAG ?? 0) === 1,
    },
  }
})
