import { Injectable, Logger } from '@nestjs/common'
import { UiContextResponseDto } from './dto/ui-context-response.dto'

@Injectable()
export class UiService {
  private readonly logger = new Logger(this.constructor.name)

  getContextData(): UiContextResponseDto['data'] {
    return {}
  }
}
