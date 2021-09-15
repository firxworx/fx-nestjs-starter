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
import { PaginatedUsersRequestDto } from './dto/paginated-users-request.dto'
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
  getUsers(@Query() paramsDto: PaginatedUsersRequestDto): Promise<PaginatedResponseDto<User>> {
    return this.usersService.getPaginatedUsers(paramsDto)
  }
}
