import { Controller, Get, HttpCode } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { AppService } from './app.service'

@ApiTags('Main')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiResponse({ status: 200, description: 'Success' })
  @HttpCode(200) // override NestJS default 201
  @Get()
  getHello(): string {
    return this.appService.getHello()
  }
}
