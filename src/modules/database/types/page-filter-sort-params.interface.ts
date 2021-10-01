import { FieldNames } from './field-names.type'

/**
 * Generic interface that correspond to query parameters of a paginated request where the
 * back-end API supports sorting and filtering some or all of the fields.
 */
export interface PageFilterSortParams<T> {
  sort?: { [P in FieldNames<T>]?: 'ASC' | 'DESC' }
  filter?: { [P in FieldNames<T>]?: string }
  offset?: number
  limit?: number
}
