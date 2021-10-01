import { PageFilterSortQueryParams } from '../page-filter-sort-query-params.interface'

/**
 * Type guard that verifies the argument is an object of the `PageFilterSortQueryParams` interface.
 *
 * All primitive values obtained from query string parameters as parsed by ExpressJS are of type `string`.
 *
 * @see PageFilterSortQueryValidationPipe<T>
 */
export const isPageFilterSortQueryParams = (x: unknown): x is PageFilterSortQueryParams => {
  return (
    typeof x === 'object' &&
    x !== null &&
    Object.entries(x).every(([key, value]) => {
      if (!['sort', 'filter', 'offset', 'limit'].includes(key)) {
        return false
      }

      if ((key === 'offset' || key === 'limit') && !Number.isFinite(Number(value))) {
        return false
      }

      if ((key === 'sort' || key === 'filter') && (typeof value !== 'object' || value === null)) {
        return false
      }

      return true
    })
  )
}
