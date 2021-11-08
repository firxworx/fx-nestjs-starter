import { ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

import { FX_IS_PUBLIC_ROUTE_HANDLER_KEY } from '../decorators/public-route-handler.decorator'

/**
 * AuthGuard to enforce JWT authentication.
 *
 * This guard implements a conditional override/bypass and will allow unauthenticated (public) requests
 * to any controller route handler that applies the `@PublicRouteHandler()` decorator.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(FX_IS_PUBLIC_ROUTE_HANDLER_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    return super.canActivate(context)
  }
}
