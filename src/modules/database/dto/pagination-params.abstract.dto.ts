import { IsNumber, Min, IsOptional, IsObject } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { PaginationQueryFilterParams, PaginationQuerySortParams } from '../types/pagination.types'

// @IsDefined()
// @IsNotEmptyObject()
// @IsObject()
// @ValidateNested()
// @Type(() => MultiLanguageDTO)

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
 * @see PaginatedResponseDto
 */
export abstract class PaginationParamsAbstractDto<T> {
  @ApiPropertyOptional({
    description: 'pagination filter params',
    // type: 'object',
    // additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  readonly filter?: PaginationQueryFilterParams<T>

  @ApiPropertyOptional({
    description: 'sort order',
    // type: 'object',
    // additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  // @todo make actual validator for sort here - PaginationQuerySortParams<T>??
  readonly sort?: PaginationQuerySortParams<T>

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
