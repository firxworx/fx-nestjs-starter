import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Exclude, Type } from 'class-transformer'
import { Column, Index, Generated, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Abstract entity that defines properties common to most project entities.
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
  // @todo good practice to include or no? --  @Type(() => Date)
  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  readonly createdAt!: Date

  @ApiHideProperty()
  @Exclude()
  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  readonly updatedAt!: Date

  @ApiHideProperty()
  @Exclude()
  @Column({ type: 'boolean', default: true })
  isActive!: boolean
}
