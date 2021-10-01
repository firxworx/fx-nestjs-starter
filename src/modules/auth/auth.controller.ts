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
  HttpStatus,
} from '@nestjs/common'
import {
  ApiBasicAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

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

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  private logger = new Logger(this.constructor.name)

  constructor(private readonly authenticationService: AuthService, private readonly usersService: UsersService) {}

  /**
   * Handle requests to register a new user.
   */
  @ApiCreatedResponse({ description: 'Success registering new user' })
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    // @starter - consider restricting user registration (e.g. to admin role, etc), sending a verification email, etc.
    this.logger.log(`User registration request: <${registerUserDto.email}>`)

    return this.authenticationService.registerUserOrThrow(registerUserDto)
  }

  /**
   * Handle requests to change the authenticated user's password.
   */
  @ApiCookieAuth()
  @ApiNoContentResponse({ description: 'Success changing password' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('password')
  @HttpCode(HttpStatus.NO_CONTENT) // override NestJS default 201
  async changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto.oldPassword, dto.newPassword)
  }

  /**
   * Handle requests to authenticate a user's access token, returning essential properties of the `User`.
   */
  @ApiCookieAuth()
  @ApiOkResponse({ status: HttpStatus.OK, description: 'Authentication success' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
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
  @ApiBasicAuth()
  @ApiOkResponse({
    description: 'Sign-in successful. Set-Cookie with access token + refresh token.',
  })
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK) // override nestjs default 201
  @Post('sign-in')
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
  @ApiCookieAuth()
  @ApiNoContentResponse({
    description: 'Sign-out successful. Set-Cookie to expire access token + refresh token.',
  })
  @UseGuards(JwtAuthGuard)
  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT) // override nestjs default 201
  async signOut(@Req() request: RequestWithUser): Promise<void> {
    await this.usersService.removeRefreshToken(request.user.id)
    request.res?.setHeader('Set-Cookie', this.authenticationService.getCookiesForLogOut())
  }

  /**
   * Respond to a valid refresh request with a cookie containing a new signed JWT access token.
   */
  @ApiCookieAuth()
  @ApiOkResponse({ status: HttpStatus.OK, description: 'Refresh successful. Set-Cookie with new access token.' })
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Get('refresh')
  refresh(@Req() request: RequestWithUser) {
    const accessTokenCookie = this.authenticationService.getCookieWithJwtAccessToken(request.user.id)

    request.res?.setHeader('Set-Cookie', accessTokenCookie)
    return request.user
  }
}
