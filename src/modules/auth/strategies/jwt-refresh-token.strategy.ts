import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'

import { UsersService } from '../../users/users.service'
import { TokenPayload } from '../types/token-payload.interface'
import { AuthConfig } from '../../../config/auth.config'
import { AuthService } from '../auth.service'

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh-token') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // cookies are added to request object via cookie-parser (refer to main.ts)
          return request?.cookies?.Refresh
        },
      ]),
      // pass request to `validate()` to access request.cookies
      secretOrKey: configService.get<AuthConfig>('auth')?.jwt.refreshToken.secret ?? '',
      passReqToCallback: true,
    })
  }

  /**
   * Given a request + JWT token payload, return the user associated with the `userId` contained in the payload.
   *
   * The object returned by this method is added to the request object of any controller method that is decorated
   * with the appropriate guard, e.g. `JwtRefreshGuard`.
   *
   * Note that the JWT is already validated at the point where this method is called.
   */
  async validate(request: Request, payload: TokenPayload) {
    const refreshToken = request.cookies?.Refresh
    const user = await this.usersService.getByIdWithRefreshToken(payload.userId)

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException()
    }

    const isValid = await this.authService.verifyHash(user.refreshTokenHash, refreshToken)

    if (isValid) {
      return {
        ...user,
        password: null,
        refreshTokenHash: null,
      }
    }

    throw new UnauthorizedException()
  }
}
