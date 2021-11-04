import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { GetUser } from '../users/decorators/get-user.decorator'
import { User } from '../users/entities/user.entity'
import { UiContextResponseDto } from './dto/ui-context-response.dto'
import { UiService } from './ui.service'
import { StripeService } from '../stripe/stripe.service'

@ApiTags('UI')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('ui')
@UseInterceptors(ClassSerializerInterceptor)
export class UiController {
  constructor(private readonly uiService: UiService, private readonly stripeService: StripeService) {}

  /**
   * Return context for the ui (front-end).
   */
  @ApiOkResponse({ description: 'Success' })
  @HttpCode(HttpStatus.OK)
  @Get()
  getUiContext(@GetUser() user: User): UiContextResponseDto {
    const context = this.uiService.getContextData()

    // note: the raw `user` object from the `GetUser()` decorator is not returned
    // to guarantee that no sensitive fields are returned in the response.

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

  @Get('/stripetest')
  stripeTest(): any {
    return this.stripeService.getCustomers()
  }
}
