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
import argon2 from 'argon2'

import { UsersService } from '../users/users.service'
import { PostgresErrorCode } from '../database/constants/postgres-error-code.enum'

import { RegisterUserDto } from './dto/register-user.dto'
import type { TokenPayload } from './types/token-payload.interface'
import { AuthConfig } from '../../config/auth.config'
import { User } from '../users/entities/user.entity'
import { isQueryFailedError } from '../database/types/type-guards/is-query-failed-error.type-guard'
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
    // the findByEmailForVerification() method selects password field that's otherwise excluded
    const user = await this.usersService.findByEmailForVerification(email)

    if (!user) {
      throw new UnauthorizedException()
    }

    if (!user.password) {
      this.logger.error(`Encountered user with no password: ${email}`)
      throw new UnauthorizedException()
    }

    const isVerified = await this.verifyHash(user.password, plainTextPassword)

    if (isVerified) {
      // at expense of an extra db query, obtain user via a 'safe' method that protects sensitive fields
      return this.usersService.getByEmail(email)
    }

    throw new UnauthorizedException('Invalid credentials')
  }

  /**
   * Return the user corresponding to the `userId` in the given JWT token payload, otherwise
   * `undefined` if the given token cannot be verified or the user is not found.
   */
  public async getUserByAuthenticationToken(token: string): Promise<User | undefined> {
    const authConfig = this.configService.get<AuthConfig>('auth')

    const payload: TokenPayload = this.jwtService.verify(token, {
      secret: authConfig?.jwt.accessToken.secret,
    })

    if (payload.userId) {
      return this.usersService.findOne(payload.userId)
    }

    return undefined
  }

  public async setUserRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const refreshTokenHash = await this.computeHash(refreshToken)
    await this.usersService.setRefreshTokenHash(userId, refreshTokenHash)
  }

  async updateUserPassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    // explicitly query user with the excluded/not-selected password field added via addSelect()
    const user = await this.usersService.findByIdForVerification(userId)

    if (!user) {
      this.logger.warn(`Failed to change user password: user id <${userId}> not found`)
      throw new UnauthorizedException()
    }

    if (!user?.password) {
      this.logger.warn(`Failed to change user password: failed assumption - user id <${userId}> password not set`)
      throw new UnauthorizedException()
    }

    const isValid = await this.verifyHash(user.password, oldPassword)

    if (!isValid) {
      this.logger.warn(`Failed to change user password: <${user.email}> current password verification failed by user`)
      throw new UnauthorizedException('Invalid credentials')
    }

    if (isValid) {
      const result = await this.usersService.setPasswordHash(user.id, await argon2.hash(newPassword))

      if (result.affected === undefined) {
        this.logger.error(`Database driver does not support returning 'affected' number of rows`)
        throw new InternalServerErrorException('Data Error')
      }

      if (result.affected === 1) {
        this.logger.log(`Password change successful: user <${user.email}> (id: <${user.id})`)
        return true
      }
    }

    throw new InternalServerErrorException('Data Error')
  }

  /**
   * @see JwtRefreshTokenStrategy
   */
  public async verifyHash(hash: string, plainText: string): Promise<boolean> {
    return argon2.verify(hash, plainText)
  }

  public async computeHash(input: string): Promise<string> {
    return argon2.hash(input)
  }
}
