import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsNumber } from 'class-validator'

/**
 * Response DTO for paginated responses that includes a `data` array of type `T` and a `totalCount`.
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  @IsArray()
  readonly data!: Array<T>

  @ApiProperty({
    description: 'Total number of records (rows) in data.',
  })
  @IsNumber()
  readonly totalCount!: number
}
