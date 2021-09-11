import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, UpdateResult } from 'typeorm'
import * as bcrypt from 'bcryptjs'

import { User } from './entities/user.entity'
import { CreateUserDto } from './dto/create-user.dto'
// import { PaginatedResponseDto } from '../database/dto/paginated-response.dto'
// import { UserDto } from './dto/user.dto'
import { PaginatedUsersRequestDto } from './dto/paginated-users-request.dto'
import { paginationFindParamsBuilder } from '../database/api/pagination-find-params-builder'

@Injectable()
export class UsersService {
  private logger = new Logger(UsersService.name)

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Return the `User` identified by the given `email` or else `undefined` if no user is found.
   */
  async getByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ email })
  }

  /**
   * Return the `User` identified by the given `email` or else throw a `NotFoundException`.
   */
  async getByEmailOrThrow(email: string): Promise<User> {
    const user = await this.getByEmail(email)

    if (!user) {
      throw new NotFoundException(`Cannot find user with email: <${email}>`)
    }

    return user
  }

  /**
   * Return the `User` identified by the given `email`, including the `password` and `refreshTokenHash` fields,
   * or else return `undefined`.
   *
   * This method supports authentication-related use-cases. The returned `User` should not be logged or
   * returned in any response because it includes sensitive fields.
   */
  async getByEmailForVerification(email: string): Promise<User | undefined> {
    return this.usersRepository
      .createQueryBuilder('user')
      .select('user.email', 'email')
      .addSelect('user.password')
      .addSelect('user.refreshTokenHash')
      .where('user.email = :email', { email })
      .getOne()
  }

  /**
   * Return an array of `User` instances that correspond to the given array of user `id`'s
   */
  async getByIds(ids: number[]): Promise<Array<User>> {
    return this.usersRepository.find({
      where: { id: In(ids) },
    })
  }

  /**
   * Return an instance of `User` that corresponds to the given `id` or else `undefined` if no user is found.
   */
  async getById(id: number): Promise<User | undefined> {
    return this.usersRepository.findOne({ id })
  }

  /**
   * Return an instance of `User` that corresponds to the given `id` or else throw a `NotFoundException`.
   */
  async getByIdOrThrow(id: number): Promise<User> {
    const user = await this.getById(id)

    if (!user) {
      throw new NotFoundException(`User with id ${id} does not exist`)
    }

    return user
  }

  /**
   * Get paginated users.
   */
  async getPaginatedUsers(paramsDto: PaginatedUsersRequestDto) {
    // maybe add better response interceptor/serializer for more options -- Promise<PaginatedResponseDto<UserDto>>
    const [users, totalCount] = await this.usersRepository.findAndCount({
      ...paginationFindParamsBuilder(paramsDto),
      // where: { ... }, // @todo - where isActive
    })

    return {
      data: users,
      totalCount,
    }
  }

  /**
   * Create a new user and return an instance of the `User` class corresponding to that user.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto)
    await this.usersRepository.save(user)

    return user
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    // explicitly query user with the excluded/not-selected password field added via addSelect()
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where({ id: userId })
      .addSelect('user.password')
      .getOne()

    if (!user) {
      this.logger.log(`Failed to change user password: user id <${userId}> not found`)
    }

    if (!user?.password) {
      this.logger.warn(`Failed to change user password: user id <${userId}> password is empty/undefined`)
      throw new InternalServerErrorException('Error authenticating user')
    }

    const isValid = await this.verifyPassword(oldPassword, user.password)

    if (!isValid) {
      this.logger.warn(`Change password fail: user <${userId}> failed to validate old password`)
      throw new UnauthorizedException('Invalid credentials')
    }

    if (isValid) {
      const newPasswordHash = await bcrypt.hash(newPassword, 10)
      const result = await this.usersRepository.update(user.id, {
        password: newPasswordHash,
      })

      if (result.affected === undefined) {
        this.logger.error(`Database driver does not support returning 'affected' number of rows`)
        throw new InternalServerErrorException('Error')
      }

      if (result.affected === 1) {
        this.logger.log(`Change password success: user <${userId}>`)
        return true
      }
    }

    throw new InternalServerErrorException('Error')
  }

  async setRefreshTokenHash(userId: number, refreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10)

    await this.usersRepository.update(userId, {
      refreshTokenHash,
    })
  }

  /**
   * @see JwtRefreshTokenStrategy
   */
  async getUserIfRefreshTokenMatches(userId: number, refreshToken: string): Promise<User | undefined> {
    // explicitly query for the excluded/not-selected refreshTokenHash field
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where({ id: userId })
      .addSelect('user.refreshTokenHash')
      .getOne()

    if (user) {
      const tokenHash = user.refreshTokenHash ?? ''
      const isRefreshTokenValid = await bcrypt.compare(refreshToken, tokenHash)

      if (isRefreshTokenValid) {
        return {
          ...user,
          password: null,
          refreshTokenHash: null,
        }
      }
    }

    return undefined
  }

  /**
   * Reset the given user's `refreshTokenHash` to `undefined` (null).
   */
  async removeRefreshToken(userId: number): Promise<UpdateResult> {
    return this.usersRepository.update(userId, {
      refreshTokenHash: undefined,
    })
  }

  /**
   * Return a boolean indicating if the given plaintext password and hash are a match.
   */
  private async verifyPassword(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash)
  }
}
