/** Default port (note: NestJS default is 3000). */
export const DEFAULT_PORT = 3000

/** Base path of this API. A path other than '/' may be required if this API is not at domain/subdomain root. */
export const DEFAULT_BASE_PATH = '/'

/** API version (e.g. 'v1') to use in REST URL path. Refer to the global prefix set in `main.ts`. */
export const DEFAULT_API_VERSION = 'v1'

export const DEFAULT_THROTTLE_LIMIT = 25
export const DEFAULT_THROTTLE_TTL = 60

/**
 * Default boolean corresponding to `DEVOPS_DEPLOY_MODE` env variable.
 *
 * Set to `true` (env variable: 'proxy') if this api is behind a reverse proxy
 * (e.g. nginx, AWS load balancer, heroku, etc) and if so, trust the `X-Forwarded-*`
 * headers and set `req.ips`, `req.hostname`, and `req.protocol` based on their values.
 */
export const DEFAULT_EXPRESS_TRUST_PROXY = false
