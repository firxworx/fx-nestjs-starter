import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

import * as bcrypt from 'bcryptjs'

import { UsersService } from '../users/users.service'
import { PostgresErrorCode } from '../database/postgres-error-code.enum'

import { RegisterUserDto } from './dto/register-user.dto'
import type { TokenPayload } from './types/token-payload.interface'
import { AuthConfig } from '../../config/auth.config'
import { User } from '../users/entities/user.entity'
import { isQueryFailedError } from '../database/types/guards/is-query-failed-error.guard'
import { getErrorMessage } from '../../common/error-helpers'

@Injectable()
export class AuthService {
  private logger = new Logger(this.constructor.name)

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user via the Users Service or throw an exception.
   */
  public async registerUserOrThrow(registerUserDto: RegisterUserDto): Promise<Pick<User, 'uuid' | 'email' | 'name'>> {
    const passwordHash = await bcrypt.hash(registerUserDto.password, 10)

    try {
      const createdUser = await this.usersService.create({
        ...registerUserDto,
        password: passwordHash,
      })

      return {
        uuid: createdUser.uuid,
        name: createdUser.name,
        email: createdUser.email,
      }
    } catch (error: unknown) {
      if (isQueryFailedError(error)) {
        if (error.code === PostgresErrorCode.UniqueViolation) {
          throw new ConflictException(`Failed to create user <${registerUserDto.email}>: email already exists`)
        }

        this.logger.error(`Failed to create user <${registerUserDto.email}>: database error code <${error.code}>`)
        throw new InternalServerErrorException(`Failed to create user <${registerUserDto.email}>: database error`)
      }

      this.logger.error(`Failed to create user <${registerUserDto.email}>: <${getErrorMessage(error)}>`)
      throw new InternalServerErrorException(`Failed to create user <${registerUserDto.email}>`)
    }
  }

  /**
   * Get set-cookie value containing a signed JWT auth (access) token.
   */
  public getCookieWithJwtAccessToken(userId: number) {
    const payload: TokenPayload = { userId }

    const authConfig = this.configService.get<AuthConfig>('auth')

    const token = this.jwtService.sign(payload, {
      secret: authConfig?.jwt.accessToken.secret,
      expiresIn: `${authConfig?.jwt.accessToken.expirationTime}s`,
    })

    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${authConfig?.jwt.accessToken.expirationTime}`
  }

  /**
   * Get set-cookie value containing a signed JWT refresh token.
   */
  public getCookieWithJwtRefreshToken(userId: number) {
    const payload: TokenPayload = { userId }

    const authConfig = this.configService.get<AuthConfig>('auth')

    const token = this.jwtService.sign(payload, {
      secret: authConfig?.jwt.refreshToken.secret,
      expiresIn: `${authConfig?.jwt.refreshToken.expirationTime}s`,
    })

    const cookie = `Refresh=${token}; HttpOnly; Path=/; Max-Age=${authConfig?.jwt.refreshToken.expirationTime}`

    return {
      cookie,
      token,
    }
  }

  /**
   * Get an array of set-cookie values that remove the authentication and refresh cookies.
   */
  public getCookiesForLogOut(): Array<string> {
    return ['Authentication=; HttpOnly; Path=/; Max-Age=0', 'Refresh=; HttpOnly; Path=/; Max-Age=0']
  }

  /**
   * Return the user associated with the given email and password. Applicable to local auth strategy.
   * @see JwtStrategy
   */
  public async getAuthenticatedUser(email: string, plainTextPassword: string): Promise<User> {
    const user = await this.usersService.getByEmailForVerification(email)

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (!user.password) {
      throw new InternalServerErrorException('Error authenticating user')
    }

    const isVerified = await this.verifyUserPassword(plainTextPassword, user.password)

    if (isVerified) {
      // only return the user via a 'safe' method that is 'protected' by entity exclude decorators
      // this protects against release of potentially sensitive information at the expense of another db query
      return this.usersService.getByEmailOrThrow(email)
    }

    throw new UnauthorizedException('Invalid credentials')
  }

  /**
   * Return a boolean indicating if the given plaintext + hashed password match.
   */
  private async verifyUserPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword)
  }

  /**
   * Return the user corresponding to the `userId` in the given JWT token payload, otherwise
   * `undefined` if the given token cannot be verified or the user is not found.
   */
  public async getUserFromAuthenticationToken(token: string): Promise<User | undefined> {
    const authConfig = this.configService.get<AuthConfig>('auth')

    const payload: TokenPayload = this.jwtService.verify(token, {
      secret: authConfig?.jwt.accessToken.secret,
    })

    if (payload.userId) {
      return this.usersService.getById(payload.userId)
    }

    return undefined
  }
}
