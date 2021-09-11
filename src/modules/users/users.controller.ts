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
import { PaginatedUsersRequestDto } from './dto/paginated-users-request.dto'
// import { PaginatedResponseDto } from '../database/dto/paginated-response.dto'
// import { UserDto } from './dto/user.dto'
import { UsersService } from './users.service'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  // private readonly logger = new Logger(this.constructor.name)

  constructor(private readonly usersService: UsersService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get list of users.',
    // type: PaginationResponseDto<UserDto>,
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  getUsers(@Query() paramsDto: PaginatedUsersRequestDto) {
    // @todo - consider adding a different type of response interceptor/serializer - Promise<PaginatedResponseDto<UserDto>>
    return this.usersService.getPaginatedUsers(paramsDto)
  }
}
