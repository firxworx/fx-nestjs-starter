import { Injectable } from '@nestjs/common'
import { FindManyOptions } from 'typeorm'
import { PageFilterSortParams } from './types/page-filter-sort-params.interface'

const DEFAULT_ROWS_PER_PAGE = 10

@Injectable()
export class QueryUtilsService {
  /**
   * Return an object with `where`, `order`, `skip`, and `take` properties + values that are
   * compatible with the TypeOrm Repository API's `findAndCount()` options.
   *
   * The object returned by this function can be passed or spread into the `findAndCount()`
   * options argument.
   *
   * @see PageFil
   * @param paramsDto
   * @returns
   */
  generatePageFilterSortFindOptions = <T>(
    params: PageFilterSortParams<T>,
  ): Pick<FindManyOptions<T>, 'where' | 'order' | 'skip' | 'take'> => {
    // typeorm will combine multiple properties of a `where` object with sql 'AND'
    const whereClause: FindManyOptions<T>['where'] = params.filter ?? {}
    const orderByClause: FindManyOptions<T>['order'] = params.sort ?? {}

    return {
      where: whereClause,
      order: {
        ...orderByClause,
      },
      skip: params.offset ?? 0,
      take: params.limit ?? DEFAULT_ROWS_PER_PAGE,
    }
  }
}
