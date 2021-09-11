import { ClassSerializerInterceptor, Controller, Get, HttpCode, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { GetUser } from '../users/decorators/get-user.decorator'
import { User } from '../users/entities/user.entity'
import { UiContextResponseDto } from './dto/ui-context-response.dto'
import { UiService } from './ui.service'

@ApiTags('UI')
@Controller('ui')
@UseInterceptors(ClassSerializerInterceptor)
export class UiController {
  constructor(private readonly uiService: UiService) {}

  /**
   * Return context for the ui (front-end).
   */
  @ApiResponse({ status: 200, description: 'Success' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(200) // override NestJS default 201
  @Get()
  getUiContext(@GetUser() user: User): UiContextResponseDto {
    const context = this.uiService.getContextData()

    // note: the raw `user` object from the `GetUser()` decorator is not returned
    // to ensure that no sensitive fields are returned in the response.

    return {
      user: {
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        timeZone: user.timeZone,
      },
      data: context,
    }
  }
}
