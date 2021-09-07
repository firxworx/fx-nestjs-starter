import { Module } from '@nestjs/common'
import { UiService } from './ui.service'
import { UiController } from './ui.controller'

@Module({
  providers: [UiService],
  controllers: [UiController],
  exports: [UiService],
})
export class UiModule {}
