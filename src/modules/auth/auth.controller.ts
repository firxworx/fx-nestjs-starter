import {
  Body,
  Req,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  Get,
  ClassSerializerInterceptor,
  UseInterceptors,
  Logger,
} from '@nestjs/common'

import { RegisterUserDto } from './dto/register-user.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

import type { RequestWithUser } from './types/request-with-user.interface'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { JwtRefreshGuard } from './guards/jwt-refresh.guard'

import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import { GetUser } from '../users/decorators/get-user.decorator'
import { User } from '../users/entities/user.entity'

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  private logger = new Logger(this.constructor.name)

  constructor(private readonly authenticationService: AuthService, private readonly usersService: UsersService) {}

  /**
   * Handle requests to register a new user.
   */
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    // @starter - consider restricting user registration (e.g. to admin role, etc) and/or sending verification email, etc.
    this.logger.log(`User registration request: <${registerUserDto.email}>`)

    return this.authenticationService.registerUserOrThrow(registerUserDto)
  }

  /**
   * Handle requests to change the authenticated user's password.
   */
  @UseGuards(JwtAuthGuard)
  @Post('password')
  @HttpCode(204) // override NestJS default 201
  async changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto.oldPassword, dto.newPassword)
  }

  /**
   * Handle requests to authenticate a user's access token, returning essential properties of the `User`.
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  authenticate(@Req() request: RequestWithUser): Pick<User, 'uuid' | 'email' | 'name' | 'timeZone'> {
    return {
      uuid: request.user.uuid,
      email: request.user.email,
      name: request.user.name,
      timeZone: request.user.timeZone,
    }
  }

  /**
   * Respond to valid sign-in requests with cookies with a new access token + refresh token.
   */
  @UseGuards(LocalAuthGuard)
  @Post('sign-in')
  @HttpCode(200) // override NestJS default 201
  async signIn(@Req() request: RequestWithUser) {
    const { user } = request
    const accessTokenCookie = this.authenticationService.getCookieWithJwtAccessToken(user.id)
    const { cookie: refreshTokenCookie, token: refreshToken } = this.authenticationService.getCookieWithJwtRefreshToken(
      user.id,
    )

    await this.usersService.setRefreshTokenHash(user.id, refreshToken)

    request.res?.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie])
    return user
  }

  /**
   * Respond to a valid sign-out request by setting new cookie values that wipe existing access + refresh token cookies.
   */
  @UseGuards(JwtAuthGuard)
  @Post('sign-out')
  @HttpCode(204) // override NestJS default 201
  async signOut(@Req() request: RequestWithUser): Promise<void> {
    await this.usersService.removeRefreshToken(request.user.id)
    request.res?.setHeader('Set-Cookie', this.authenticationService.getCookiesForLogOut())
  }

  /**
   * Respond to a valid refresh request with a cookie containing a new signed JWT access token.
   */
  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  refresh(@Req() request: RequestWithUser) {
    const accessTokenCookie = this.authenticationService.getCookieWithJwtAccessToken(request.user.id)

    request.res?.setHeader('Set-Cookie', accessTokenCookie)
    return request.user
  }
}