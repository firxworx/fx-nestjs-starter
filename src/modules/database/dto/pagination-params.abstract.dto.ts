import { IsNumber, Min, IsOptional, IsObject } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

// import { SqlOrder } from '../constants/sql-order.enum'

// @IsDefined()
// @IsNotEmptyObject()
// @IsObject()
// @ValidateNested()
// @Type(() => MultiLanguageDTO)

// export abstract class AbstractEntity<DTO extends AbstractDto = AbstractDto> {

/**
 * Abstract DTO class for Pagination-related parameters.
 *
 * Supports pagination-related query strings that may have been constructed by the client using the
 * `URLSearchParams()` API.
 *
 * Example usage (in a controller):
 *
 * `@Query() params: PaginationParamsDto`
 *
 * Example query string supported by this DTO:
 *
 * `posts?filter[author]=sally&filter[tag]=news&sort[postedAt]=desc&offset=0&limit=25`
 *
 * @WIP @todo AbstractPaginationParamsDto WIP
 */
export abstract class PaginationParamsAbstractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  readonly filter?: any = {}

  @ApiPropertyOptional({
    description: 'sort order',
    // enum: SqlOrder,
  })
  @IsOptional()
  @IsObject()
  // @IsEnum(SqlOrder) // @todo make actual validator for sort here
  readonly sort?: any = {}

  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly offset?: number

  @ApiPropertyOptional({
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  readonly limit?: number
}
