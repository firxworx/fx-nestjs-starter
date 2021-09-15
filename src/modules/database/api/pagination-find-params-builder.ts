import { FindConditions, FindManyOptions } from 'typeorm'
import { PaginationParamsAbstractDto } from '../dto/pagination-params.abstract.dto'

const DEFAULT_ROWS_PER_PAGE = 100
// const MAX_ROWS_PER_PAGE = 1000

export interface PaginationFindParams<T> extends Required<Pick<FindManyOptions<T>, 'skip' | 'take'>> {
  where?: FindConditions<T> // FindManyOptions<T>['where'] // FindConditions<T> | Array<FindConditions<T>>
  order?: FindManyOptions<T>['order']
}

/**
 * @WIP
 * @todo paginationFindParamsBuilder is a WIP
 * @param paramsDto
 * @returns
 */
export const paginationFindParamsBuilder = <T>(
  paramsDto: PaginationParamsAbstractDto<T>, // Record<string, unknown> & AbstractPaginationParamsDto,
): PaginationFindParams<T> => {
  // per the typeorm repository api, the properties of  `where` object passed are joined via logical AND
  const whereClause = paramsDto.filter ?? {} // const whereClause: PaginationFindParams<T>['where'] = paramsDto.filter ?? {}
  const orderByClause: PaginationFindParams<T>['order'] = paramsDto.sort ?? {}

  return {
    where: whereClause,
    order: {
      ...orderByClause,
    },
    skip: paramsDto.offset ?? 0,
    take: paramsDto.limit ?? DEFAULT_ROWS_PER_PAGE,
  }
}
