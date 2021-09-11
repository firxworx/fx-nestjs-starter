import { Exclude } from 'class-transformer'
import { Column, Index, Generated, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

export abstract class Base {
  @Exclude()
  @PrimaryGeneratedColumn()
  readonly id!: number

  @Index({ unique: true })
  @Generated('uuid')
  @Column()
  readonly uuid!: string

  @CreateDateColumn() // @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  readonly createdAt!: Date

  @UpdateDateColumn() // @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  readonly updatedAt!: Date

  // @Column({ type: 'varchar', length: 300 })
  // createdBy: string

  // @Column({ type: 'varchar', length: 300 })
  // updatedBy: string

  // @Column({ type: 'varchar', length: 300, nullable: true })
  // internalComment: string | null

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  // @Column({ type: 'boolean', default: false })
  // isArchived!: boolean
}
