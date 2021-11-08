import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, UpdateResult } from 'typeorm'

import { User } from './entities/user.entity'
import { PaginatedResponseDto } from '../database/dto/paginated-response.dto'
import { QueryUtilsService } from '../database/query-utils.service'
import { PageFilterSortParams } from '../database/types/page-filter-sort-params.interface'
import { CrudAbstractService } from '../database/crud.abstract.service'

@Injectable()
export class UsersService extends CrudAbstractService<User> {
  private logger = new Logger(UsersService.name)

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private queryUtilsService: QueryUtilsService,
  ) {
    super(usersRepository)
  }

  /**
   * Find and return user with the given email address (or undefined if not found).
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ email })
  }

  /**
   * Return user with the given email or throw a `NotFoundException`.
   */
  async getByEmail(email: string): Promise<User> {
    const user = await this.findByEmail(email)

    if (!user) {
      throw new NotFoundException(`User not found: ${email}`)
    }

    return user
  }

  /**
   * Find and return the user with the given email including select for their `password` and `refreshTokenHash` fields.
   *
   * As with other find* methods, returns `undefined` if no user is found.
   *
   * This method supports authentication-related use-cases. The user returned by this method should not be logged or
   * returned by any response because it includes sensitive data.
   */
  async findByEmailForVerification(email: string): Promise<User | undefined> {
    return this.usersRepository
      .createQueryBuilder('user')
      .select('user.email', 'email')
      .addSelect('user.password')
      .addSelect('user.refreshTokenHash')
      .where('user.email = :email', { email })
      .getOne()
  }

  /**
   * Find and return the user at the given id including select for their `password` and `refreshTokenHash` fields.
   *
   * As with other find* methods, returns `undefined` if no user is found.
   *
   * This method supports authentication-related use-cases. The user returned by this method should not be logged or
   * returned by any response because it includes sensitive data.
   */
  async findByIdForVerification(id: number): Promise<User | undefined> {
    return this.usersRepository
      .createQueryBuilder('user')
      .select('user.email', 'email')
      .addSelect('user.password')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
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
   * Get paginated users.
   */
  async getPaginatedUsers(params: PageFilterSortParams<User>): Promise<PaginatedResponseDto<User>> {
    // maybe add better response interceptor/serializer for more options -- Promise<PaginatedResponseDto<UserDto>>
    // @todo - revise paginationFindParamsBuilder() to accept regular FindManyOptions and add the pagination stuff to that and then return
    // @todo - maybe also one for the isActive() flag
    const [users, totalCount] = await this.usersRepository.findAndCount({
      ...this.queryUtilsService.generatePageFilterSortFindOptions(params),
      // where: { ... }, // @todo - where isActive
    })

    return new PaginatedResponseDto(User, users, totalCount)
  }

  /**
   * Set the value of the given user's password property. This function is intended for
   * use by an auth-related module and assumes that it is being provided a salted hash computed
   * by a reasonably secure hash algorithm.
   */
  async setPasswordHash(userId: number, passwordHash: string): Promise<UpdateResult> {
    return this.usersRepository.update(userId, {
      password: passwordHash,
    })
  }

  /**
   * Set the value of the given user's refreshTokenHash property. This function is intended for
   * use by an auth-related module and assumes that it is being provided a computed hash.
   */
  async setRefreshTokenHash(userId: number, refreshTokenHash: string): Promise<UpdateResult> {
    return this.usersRepository.update(userId, {
      refreshTokenHash,
    })
  }

  async getByIdWithRefreshToken(userId: number): Promise<User | undefined> {
    // explicitly query for the excluded/not-selected refreshTokenHash field
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where({ id: userId })
      .addSelect('user.refreshTokenHash')
      .getOne()

    if (!user) {
      this.logger.error(`Error querying user with refresh token - user id <${userId}>`)
      throw new InternalServerErrorException()
    }

    return user
  }

  /**
   * Reset the given user's `refreshTokenHash` to `undefined` (null).
   */
  async removeRefreshToken(userId: number): Promise<UpdateResult> {
    return this.usersRepository.update(userId, {
      refreshTokenHash: undefined,
    })
  }
}
