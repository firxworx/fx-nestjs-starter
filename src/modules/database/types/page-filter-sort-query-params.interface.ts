/**
 * Raw pagination/sort/filter query params as parsed by ExpressJS from a request's query string
 * and added to `request.query`.
 *
 * All non-object/non-array primitive values that ExpressJS obtains from a query string are of type `string`.
 */
export interface PageFilterSortQueryParams {
  sort?: Record<string, string>
  filter?: Record<string, string>
  offset?: string
  limit?: string
}
