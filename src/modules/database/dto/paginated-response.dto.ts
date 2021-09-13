import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Type } from 'class-transformer'
import { IsArray, IsNumber } from 'class-validator'

/**
 * Response DTO for paginated responses that includes a `data` array of type `T` and a `totalCount`.
 */
export class PaginatedResponseDto<T> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(type: Function, data: Array<T>, totalCount: number) {
    this.type = type
    this.data = data
    this.totalCount = totalCount
  }
  // constructor(private type: { new (): T }) {}

  @Exclude()
  private type: Function // eslint-disable-line @typescript-eslint/ban-types
  // private type: new (): T

  @ApiProperty({ isArray: true })
  @IsArray()
  @Type((options) => {
    return (options?.newObject as PaginatedResponseDto<T>)?.type
  })
  readonly data!: Array<T>

  @ApiProperty({
    description: 'Total number of records (rows) in data.',
  })
  @IsNumber()
  readonly totalCount!: number
}
