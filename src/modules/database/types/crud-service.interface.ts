import { DeepPartial } from 'typeorm'

export interface CrudService<T> {
  findAll(): Promise<Array<T>>
  findOne<ID extends number | string>(identifier: ID): Promise<T | undefined>
  find<ID extends Array<number> | Array<string>>(identifier: ID): Promise<Array<T>>
  update<ID extends number | string>(identifier: ID, dto: DeepPartial<T>): Promise<T>
  create(dto: DeepPartial<T>): Promise<T>
  remove<ID extends number | string>(identifier: ID): Promise<T>
}
