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

  @CreateDateColumn()
  readonly createdAt!: Date

  @UpdateDateColumn()
  readonly updatedAt!: Date

  // createdBy
  // updatedBy
}
