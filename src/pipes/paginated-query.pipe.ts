import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'
import isInt from 'validator/lib/isInt'

// eslint-disable-next-line
type FieldNames<T> = { [P in keyof T]: T[P] extends Function ? never : P }[keyof T]

type QuerySortParams<T> = { [P in FieldNames<T>]?: 'ASC' | 'DESC' }
type QueryFilterParams<T> = { [P in FieldNames<T>]?: string }

/**
 * Generic interface that correspond to query parameters of a paginated request where the
 * back-end API supports sorting and filtering some or all of the fields.
 */
interface QueryParamsDto<T> {
  sort?: QuerySortParams<T>
  filter?: QueryFilterParams<T>
  offset?: number
  limit?: number
}

/**
 * Type guard that validates the given argument is a raw query string as parsed by ExpressJS
 * where all query string parameters are initially of type `string`.
 *
 * Used internally by `PaginatedQueryPipe<T>`.
 *
 * @see PaginatedQueryPipe<T>
 */
export const isRawParsedQueryParamsDto = (
  x: unknown,
): x is {
  sort?: Record<string, string>
  filter?: Record<string, string>
  offset?: string
  limit?: string
} => {
  return (
    typeof x === 'object' &&
    x !== null &&
    Object.keys(x).every((key) => ['sort', 'filter', 'offset', 'limit'].includes(key))
  )
}

/**
 * Custom validation pipe for validating query parameters of a request for paginated data that
 * can be be sorted + filtered by the back-end. This pipe can be useful for datatable implementations.
 *
 * The pipe returns a generic object `QueryParamsDto<T>` with
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
export class PaginatedQueryPipe<T> implements PipeTransform {
  constructor(private allowedFields: { sort?: Array<string>; filter?: Array<string> }) {}
  // constructor(private sortFields?: Array<keyof T>, private filterFields?: Array<keyof T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): QueryParamsDto<T> {
    if (!isRawParsedQueryParamsDto(value)) {
      throw new BadRequestException(
        'Invalid query string parameters. Supported parameters: sort, filter, offset, limit',
      )
    }

    if (metadata.type !== 'query') {
      throw new InternalServerErrorException('Error')
    }

    const sortFields = this.allowedFields?.sort
    const filterFields = this.allowedFields?.filter

    const errors: Record<string, string> = {}

    const isValidOffset = value.offset ? isInt(value.offset, { min: 0 }) : true
    const isValidLimit = value?.limit ? isInt(value.limit, { min: 1 }) : true

    const isValidSortFields =
      sortFields && value.sort
        ? Object.entries(value.sort).every(
            ([fieldName, val]) =>
              sortFields?.includes(fieldName) && typeof val === 'string' && ['ASC', 'DESC'].includes(val),
          )
        : true

    const isValidFilterFields =
      filterFields && value.filter
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
      errors['sort'] = `supported sort fields: ${(sortFields ?? []).join(', ')}; accepted values: 'ASC', 'DESC'`
    }

    if (!isValidFilterFields) {
      errors['filter'] = `supported filter fields: ${(filterFields ?? []).join(', ')}`
    }

    if (Object.keys(errors).length) {
      throw new BadRequestException({
        message: 'Invalid query parameters',
        errors,
      })
    }

    return {
      ...((value.filter ? { filter: value.filter } : {}) as QueryParamsDto<T>['filter']),
      ...((value.sort ? { sort: value.sort } : {}) as QueryParamsDto<T>['sort']),
      offset: Number(value.offset ?? 0),
      limit: Number(value.limit ?? 1),
    }
  }
}
