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
} from 'typeorm'

/**
 * Abstract entity that defines fields common to most project entities, including a `deletedAt` field
 * that's compatible with typeorm's soft-delete feature.
 *
 * A design decision is to define both a primary key `id` and a unique `uuid` field.
 *
 * As a consideration for postgres + node-postgres, fields with type `Date` are created with type `timestamptz`.
 *
 * @see {@link https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timestamp_.28without_time_zone.29}
 */
export abstract class Base {
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
}
