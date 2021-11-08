import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiCookieAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger'
import { ApiPaginatedResponse } from '../database/decorators/openapi/api-paginated-response.decorator'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PaginatedResponseDto } from '../database/dto/paginated-response.dto'
import { PageFilterSortQueryValidationPipe } from '../database/pipes/page-filter-sort-query-validation.pipe'
import { PageFilterSortParams } from '../database/types/page-filter-sort-params.interface'
import { CreateUserDto } from './dto/create-user.dto'

import { User } from './entities/user.entity'
import { UsersService } from './users.service'

@ApiTags('Users')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  // private readonly logger = new Logger(this.constructor.name)

  constructor(private readonly usersService: UsersService) {}

  @ApiCreatedResponse()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDto): Promise<User> {
    // @todo roles
    return this.usersService.create(dto)
  }

  @ApiPaginatedResponse(User)
  @Get()
  @HttpCode(HttpStatus.OK)
  async getUsers(
    @Query(
      new PageFilterSortQueryValidationPipe<User>({
        filter: ['email', 'timeZone'],
        sort: ['email'],
      }),
    )
    params: PageFilterSortParams<User>,
  ): Promise<PaginatedResponseDto<User>> {
    return this.usersService.getPaginatedUsers(params)
  }
}
