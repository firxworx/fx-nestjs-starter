import { DeepPartial } from 'typeorm'

export interface CrudService<T> {
  findAll(): Promise<Array<T>>
  find<ID extends number | string>(identifier: ID): Promise<T | undefined>
  update<ID extends number | string>(identifier: ID, dto: DeepPartial<T>): Promise<T>
  create(dto: DeepPartial<T>): Promise<T>
  remove<ID extends number | string>(identifier: ID): Promise<T>
}
