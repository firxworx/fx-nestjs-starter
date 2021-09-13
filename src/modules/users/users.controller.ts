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
import { ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PaginatedResponseDto } from '../database/dto/paginated-response.dto'
import { PaginatedUsersRequestDto } from './dto/paginated-users-request.dto'
import { User } from './entities/user.entity'
import { UsersService } from './users.service'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  // private readonly logger = new Logger(this.constructor.name)

  constructor(private readonly usersService: UsersService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get list of users.',
    // type: PaginatedResponseDto // type: PaginatedResponseDto<User>,
    // @todo - https://nartc.me/blog/nestjs-swagger-generics
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  getUsers(@Query() paramsDto: PaginatedUsersRequestDto): Promise<PaginatedResponseDto<User>> {
    // @todo - consider adding a different type of response interceptor/serializer - Promise<PaginatedResponseDto<UserDto>>
    return this.usersService.getPaginatedUsers(paramsDto)
  }
}
