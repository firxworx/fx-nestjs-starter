import { InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { DeepPartial, In, Repository } from 'typeorm'
import { CrudService } from './types/crud-service.interface'
import { BaseAbstractEntity } from './base.abstract.entity'

const isNumberArray = (value: unknown): value is Array<number> => {
  if (!Array.isArray(value)) {
    return false
  }

  if (value.some((v) => typeof v !== 'number')) {
    return false
  }

  return true
}

const isStringArray = (value: unknown): value is Array<string> => {
  if (!Array.isArray(value)) {
    return false
  }

  if (value.some((v) => typeof v !== 'string')) {
    return false
  }

  return true
}

export abstract class CrudAbstractService<T extends BaseAbstractEntity> implements CrudService<T> {
  protected constructor(protected genericRepository: Repository<T>) {}

  async findAll(): Promise<Array<T>> {
    return this.genericRepository.find()
  }

  async find<ID extends Array<number> | Array<string>>(identifiers: ID): Promise<Array<T>> {
    if (isNumberArray(identifiers)) {
      return this.genericRepository.find({
        where: { id: In(identifiers) },
      })
    }

    if (isStringArray(identifiers)) {
      return this.genericRepository.find({
        where: { uuid: In(identifiers) },
      })
    }

    throw new InternalServerErrorException('Entity exception')
  }

  async findOne<ID extends number | string>(identifier: ID): Promise<T | undefined> {
    if (typeof identifier === 'string') {
      return this.genericRepository.findOne({
        where: {
          uuid: identifier,
        },
      })
    }

    return this.genericRepository.findOne(identifier)
  }

  async create(dto: DeepPartial<T>): Promise<T> {
    const entity = this.genericRepository.create(dto)
    await this.genericRepository.save(dto)

    return entity
  }

  async update(identifier: number | string, dto: DeepPartial<T>): Promise<T> {
    const id = typeof identifier === 'number' ? identifier : (await this.findOne(identifier))?.id

    if (!id) {
      throw new NotFoundException(`Failed to update: not found`)
    }

    const entity = await this.genericRepository.preload({
      id,
      ...dto,
    })

    if (!entity) {
      throw new NotFoundException(`Failed to update: not found`)
    }

    // @ts-expect-error typeorm issue with DeepPartial and generics https://github.com/typeorm/typeorm/issues/2904
    await this.genericRepository.save(entity)

    return entity
  }

  async remove(identifier: number | string): Promise<T> {
    const entity = await this.findOne(identifier)

    if (!entity) {
      throw new NotFoundException('Failed to delete: not found')
    }

    return this.genericRepository.remove(entity)
  }
}
