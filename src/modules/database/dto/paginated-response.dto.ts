import { ApiResponseProperty } from '@nestjs/swagger'
import { Exclude, Type } from 'class-transformer'
import { IsArray, IsNumber } from 'class-validator'

/**
 * Response DTO for a paginated response with a `data` array and `count`.
 */
export class PaginatedResponseDto<T> {
  constructor(type: { new (): T }, data: Array<T>, count: number) {
    this.type = type
    this.data = data
    this.count = count
  }

  @Exclude()
  private type: { new (): T }

  @ApiResponseProperty() // @ApiProperty({ isArray: true })
  @IsArray()
  @Type((options) => {
    return (options?.newObject as PaginatedResponseDto<T>)?.type
  })
  readonly data!: Array<T>

  @ApiResponseProperty() // {description: 'Total number of records (rows) in data',}
  @IsNumber()
  readonly count!: number
}
