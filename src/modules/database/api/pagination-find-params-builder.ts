import { FindConditions, FindManyOptions } from 'typeorm'
import { RequestQueryFilterParams, RequestQuerySortParams } from '../types/query-params.types'

const DEFAULT_ROWS_PER_PAGE = 100
// const MAX_ROWS_PER_PAGE = 1000

export interface PaginationFindParams<T> extends Required<Pick<FindManyOptions<T>, 'skip' | 'take'>> {
  where?: FindConditions<T> // FindManyOptions<T>['where'] // FindConditions<T> | Array<FindConditions<T>>
  order?: FindManyOptions<T>['order']
}

interface RequestQueryParams<T> {
  sort?: RequestQueryFilterParams<T>
  filter?: RequestQuerySortParams<T>
  offset?: number
  limit?: number
}

/**
 * @WIP
 * @todo paginationFindParamsBuilder is a WIP
 * @param paramsDto
 * @returns
 */
export const paginationFindParamsBuilder = <T>(
  paramsDto: RequestQueryParams<T>, // Record<string, unknown> & AbstractPaginationParamsDto,
): PaginationFindParams<T> => {
  // per the typeorm repository api, the properties of  `where` object passed are joined via logical AND
  const whereClause = paramsDto.filter ?? {} // const whereClause: PaginationFindParams<T>['where'] = paramsDto.filter ?? {}
  const orderByClause = paramsDto.sort ?? {} // const orderByClause: PaginationFindParams<T>['order'] = paramsDto.sort ?? {}

  return {
    where: whereClause,
    order: {
      ...orderByClause,
    },
    skip: paramsDto.offset ?? 0,
    take: paramsDto.limit ?? DEFAULT_ROWS_PER_PAGE,
  }
}
