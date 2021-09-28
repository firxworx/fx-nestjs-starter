import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common'

import isInt from 'validator/lib/isInt'

// eslint-disable-next-line
type FieldNames<T> = { [P in keyof T]: T[P] extends Function ? never : P }[keyof T]

type QuerySortParams<T> = { [P in FieldNames<T>]?: 'ASC' | 'DESC' }
type QueryFilterParams<T> = { [P in FieldNames<T>]?: string }

interface QueryParamsDto<T> {
  sort?: QuerySortParams<T>
  filter?: QueryFilterParams<T>
  offset?: number
  limit?: number
}

// type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T]

@Injectable()
export class PaginatedQueryPipe<T> implements PipeTransform {
  constructor(private sortFields?: Array<string>, private filterFields?: Array<string>) {}
  // constructor(private sortFields?: Array<keyof T>, private filterFields?: Array<keyof T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): QueryParamsDto<T> {
    // this validation pipe expects the filter value to be an object
    if (typeof value !== 'object' || value === null) {
      throw new BadRequestException('Invalid query')
    }

    const specimen: Record<string, any> = value

    const isValidOffset = specimen?.offset ? isInt(specimen.offset, { min: 0 }) : true
    const isValidLimit = specimen?.limit ? isInt(specimen.limit, { min: 1 }) : true

    const isValidSortFields =
      this.sortFields && specimen.sort
        ? Object.entries(specimen.sort).every(
            ([fieldName, val]) =>
              this.sortFields?.includes(fieldName) && typeof val === 'string' && ['ASC', 'DESC'].includes(val),
          )
        : true

    const isValidFilterFields =
      this.filterFields && specimen.filter
        ? Object.entries(specimen.filter).every(
            ([fieldName, val]) => this.filterFields?.includes(fieldName) && typeof val === 'string',
          )
        : true

    console.log('offset', isValidOffset)
    console.log('limit', isValidLimit)
    console.log('filter', isValidFilterFields)

    // if (!isValidOffset || !isValidLimit || !isValidFilterFields) {
    //   throw new BadRequestException('Invalid query value')
    // }

    if (!isValidSortFields) {
      throw new BadRequestException(`Invalid sort query parameter value. Accepted values: 'ASC', 'DESC'`)
    }

    return value
  }
}
