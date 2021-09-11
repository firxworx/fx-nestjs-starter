import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'

import { UsersService } from '../users/users.service'
import { TokenPayload } from './types/token-payload.interface'
import { AuthConfig } from '../../config/auth.config'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService, private readonly userService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // cookies added to request object via cookie-parser (refer to main.ts)
          return request?.cookies?.Authentication
        },
      ]),
      secretOrKey: configService.get<AuthConfig>('auth')?.jwt.accessToken.secret ?? '',
    })
  }

  /**
   * Given a JWT token payload, return an instance of `User` associated with the `userId` contained in the payload.
   *
   * The object returned by this method is added to the request object of any controller method that is decorated
   * with the appropriate guard, e.g. `JwtAuthGuard`.
   *
   * Note that the JWT is already validated at the point where this method is called.
   */
  async validate(payload: TokenPayload) {
    const user = this.userService.getById(payload.userId)

    if (!user) {
      throw new UnauthorizedException('Unauthorized')
    }

    return this.userService.getById(payload.userId)
  }
}
