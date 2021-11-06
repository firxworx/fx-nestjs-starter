import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Exclude } from 'class-transformer'
import {
  Column,
  Index,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  VersionColumn,
} from 'typeorm'

/**
 * Abstract entity that defines fields common to most project entities, including both an `id` (auto incrementing integer) and
 * unique `uuid` fields (UUID's are often useful as for public-facing identifiers), as well as `createdAt`, `updatedAt`,
 * and `deletedAt` fields.
 *
 * The `deletedAt` field is compatible with typeorm's soft-delete feature.
 *
 * Take note of the implications of soft-delete when used in conjunction with `unique` constraints on fields
 * (for example: consider an entity with a unique `email` field) and handle if/as required.
 *
 * As a consideration for postgres + node-postgres, fields with type `Date` are created with type `timestamptz`.
 *
 * @see {@link https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timestamp_.28without_time_zone.29}
 */
export abstract class BaseAbstractEntity {
  @ApiHideProperty()
  @Exclude()
  @PrimaryGeneratedColumn()
  readonly id!: number

  @ApiProperty()
  @Index({ unique: true })
  @Generated('uuid')
  @Column()
  readonly uuid!: string

  @ApiHideProperty()
  @Exclude()
  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  readonly createdAt!: Date

  @ApiHideProperty()
  @Exclude()
  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  readonly updatedAt!: Date

  @ApiHideProperty()
  @Exclude()
  @DeleteDateColumn()
  public deletedAt!: Date

  @ApiHideProperty()
  @Exclude()
  @VersionColumn()
  version!: number
}
