import { FindConditions, FindManyOptions } from 'typeorm'
import { AbstractPaginationParamsDto } from '../dto/abstract-pagination-params.dto'

const DEFAULT_ROWS_PER_PAGE = 100
// const MAX_ROWS_PER_PAGE = 1000

// export interface PaginatedParamsDto extends AbstractPaginationParamsDto {}

/*
note --
(alias) type FindConditions<T> = { [P in keyof T]?: FindConditions<T[P]> | FindOperator<FindConditions<T[P]>> | undefined; }
*/

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
  paramsDto: AbstractPaginationParamsDto, // Record<string, unknown> & AbstractPaginationParamsDto,
): PaginationFindParams<T> => {
  // per typeorm repository api the properties of object passed to `where` are joined via logical AND
  const whereClause = paramsDto.filter
  const orderByClause: any = paramsDto.sort

  return {
    where: whereClause,
    order: {
      ...(orderByClause ?? {}),
    },
    skip: paramsDto.offset ?? 0,
    take: paramsDto.limit ?? DEFAULT_ROWS_PER_PAGE,
  }
}
