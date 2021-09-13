import { Exclude } from 'class-transformer'
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
  @Exclude()
  @PrimaryGeneratedColumn()
  readonly id!: number

  @Index({ unique: true })
  @Generated('uuid')
  @Column()
  readonly uuid!: string

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  readonly createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  readonly updatedAt!: Date

  @Column({ type: 'boolean', default: true })
  isActive!: boolean
}
