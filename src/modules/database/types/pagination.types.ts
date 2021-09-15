import { EntityFieldsNames } from 'typeorm/common/EntityFieldsNames'
import { SqlOrder } from '../constants/sql-order.enum'

// for reference: type EntityFieldsNames = { [P in keyof T]: T[P] extends Function ? never : P }[keyof T]

// export type PaginationQueryFilterParams<T> = { [P in EntityFieldsNames<T>]?: FindConditions<T[P]> }
// export type PaginationQueryFilterParams<T> = { [P in EntityFieldsNames<T>]?: Record<string, any> }

export type PaginationQueryFilterParams<T> = { [P in EntityFieldsNames<T>]?: string }
export type PaginationQuerySortParams<T> = { [P in EntityFieldsNames<T>]?: SqlOrder }
