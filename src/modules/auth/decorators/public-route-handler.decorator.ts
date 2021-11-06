import { SetMetadata } from '@nestjs/common'

export const FX_IS_PUBLIC_ROUTE_HANDLER_KEY = 'FX_IS_PUBLIC_ROUTE_HANDLER_KEY'

/**
 * Decorator for controller methods to declaratively set a given endpoint + request type as being publicly accessible.
 *
 * **This decorator will disable authentication**.
 *
 * `JwtAuthGuard` as exported by AuthModule will bypass authentication (i.e. allow public/unauthenticated requests)
 * when this decorator is applied.
 *
 * @see https://docs.nestjs.com/security/authentication
 */
export const PublicRouteHandler = () => SetMetadata(FX_IS_PUBLIC_ROUTE_HANDLER_KEY, true)
