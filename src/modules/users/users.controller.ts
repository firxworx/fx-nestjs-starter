import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ApiPaginatedResponse } from '../database/decorators/openapi/api-paginated-response.decorator'
import { PaginatedResponseDto } from '../database/dto/paginated-response.dto'
import { PageFilterSortQueryValidationPipe } from '../database/pipes/page-filter-sort-query-validation.pipe'
import { PageFilterSortParams } from '../database/types/page-filter-sort-params.interface'

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

  @ApiPaginatedResponse(User)
  @Get()
  @HttpCode(HttpStatus.OK)
  getUsers(
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
