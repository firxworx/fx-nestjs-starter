import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'
import isInt from 'validator/lib/isInt'
import { FieldNames } from '../types/field-names.type'

import { PageFilterSortParams } from '../types/page-filter-sort-params.interface'
import { isPageFilterSortQueryParams } from '../types/type-guards/is-page-filter-sort-query-params.type-guard'

/**
 * Custom validation pipe for query string parameters related to requests for paginated data with optional
 * filter + sort operations. This pipe was created to support datatables on the front-end.
 *
 * The pipe returns a generic object `PageFilterSortParams<T>` with
 *
 * Example query string format supported by this pipe:
 * `posts?filter[author]=sally&filter[tag]=news&sort[postedAt]=desc&offset=0&limit=25`
 *
 * This pipe assumes the default 'extended' behaviour of ExpressJS `query parser` settings: that items in square
 * brackets will be parsed as object properties.
 *
 * To restrict support `sort` and/or `filter` operations on a subset of the returned entity/DTO's properties,
 * pass the names of the fields you want to allow as items in the corresponding array.
 *
 * Usage example:
 *
 * ```ts
 * // e.g. Get('example')
 * exampleControllerGetMethod(@Query(new PaginatedQueryPipe<User>({
 *     sort: ['email'],
 *     filter: ['email', 'timeZone'],
 *   }),
 * ) paramsDto: QueryParamsDto<User>): Promise<PaginatedResponseDto<User>> {
 * ```
 */
@Injectable()
export class PageFilterSortQueryValidationPipe<T> implements PipeTransform {
  constructor(
    private allowedFields: {
      sort?: Array<Exclude<FieldNames<T>, number | symbol>>
      filter?: Array<Exclude<FieldNames<T>, number | symbol>>
    },
  ) {}
  transform(value: unknown, metadata: ArgumentMetadata): PageFilterSortParams<T> {
    if (!isPageFilterSortQueryParams(value)) {
      throw new BadRequestException(
        'Invalid query string parameters. Supported parameters: sort, filter, offset, limit',
      )
    }

    if (!(metadata.type === 'query')) {
      throw new InternalServerErrorException('Error')
    }

    const sortFields: Array<string> = this.allowedFields?.sort ?? []
    const filterFields: Array<string> = this.allowedFields?.filter ?? []

    const errors: Record<string, string> = {}

    const isValidOffset = value.offset ? isInt(value.offset, { min: 0 }) : true
    const isValidLimit = value?.limit ? isInt(value.limit, { min: 1 }) : true

    const isValidSortFields = value.sort
      ? Object.entries(value.sort).every(
          ([fieldName, val]) =>
            sortFields?.includes(fieldName) && typeof val === 'string' && ['ASC', 'DESC'].includes(val),
        )
      : true

    const isValidFilterFields = value.filter
      ? Object.entries(value.filter).every(
          ([fieldName, val]) => filterFields?.includes(fieldName) && typeof val === 'string',
        )
      : true

    if (!isValidOffset) {
      errors['offset'] = `offset must be an integer >= 0`
    }

    if (!isValidLimit) {
      errors['limit'] = `limit must be an integer >= 1`
    }

    if (!isValidSortFields) {
      errors['sort'] = `expecting object with optional propert${sortFields.length > 1 ? `ies` : 'y'} ${(
        sortFields ?? []
      )
        .map((sf) => `'${sf}'`)
        .join(', ')} with value${sortFields.length > 1 ? `s` : ''} 'ASC' or 'DESC'`
    }

    if (!isValidFilterFields) {
      errors['filter'] = `expecting object with optional propert${sortFields.length > 1 ? `ies` : 'y'} ${(
        filterFields ?? []
      )
        .map((ff) => `'${ff}'`)
        .join(', ')} and string value${sortFields.length > 1 ? `s` : ''}`
    }

    if (Object.keys(errors).length) {
      throw new BadRequestException({
        message: 'Invalid query parameters',
        errors,
      })
    }

    return {
      ...((value.filter ? { filter: value.filter } : {}) as PageFilterSortParams<T>['filter']),
      ...((value.sort ? { sort: value.sort } : {}) as PageFilterSortParams<T>['sort']),
      offset: Number(value.offset ?? 0),
      limit: Number(value.limit ?? 1),
    }
  }
}
