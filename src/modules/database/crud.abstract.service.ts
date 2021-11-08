import { NotFoundException } from '@nestjs/common'
import { DeepPartial, Repository } from 'typeorm'
import { CrudService } from './types/crud-service.interface'
import { BaseAbstractEntity } from './base.abstract.entity'

export abstract class CrudAbstractService<T extends BaseAbstractEntity> implements CrudService<T> {
  protected constructor(protected readonly genericRepository: Repository<T>) {}

  async findAll(): Promise<Array<T>> {
    return this.genericRepository.find()
  }

  async find<ID extends number | string>(identifier: ID): Promise<T | undefined> {
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
    const id = typeof identifier === 'number' ? identifier : (await this.find(identifier))?.id
    const entity = await this.genericRepository.preload({
      id,
      ...dto,
    })

    if (!entity) {
      throw new NotFoundException(`Failed to update: not found`)
    }

    // @ts-expect-error @todo understand the type issue w/ typeorm here
    await this.genericRepository.save(entity)

    return entity
  }

  async remove(identifier: number | string): Promise<T> {
    const entity = await this.find(identifier)

    if (!entity) {
      throw new NotFoundException('Failed to delete: not found')
    }

    return this.genericRepository.remove(entity)
  }
}
