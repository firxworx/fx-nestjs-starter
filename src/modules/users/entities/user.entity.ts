import { Column, CreateDateColumn, Entity, Generated, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Exclude } from 'class-transformer'

// this entity does not extend Database module's BaseEntity due to differences
@Entity()
export class User {
  @Exclude()
  @PrimaryGeneratedColumn()
  readonly id!: number

  @Index({ unique: true })
  @Generated('uuid')
  @Column()
  readonly uuid!: string

  @CreateDateColumn()
  @Exclude()
  readonly createdAt!: Date

  @UpdateDateColumn()
  @Exclude()
  readonly updatedAt!: Date

  @Column('varchar', { unique: true })
  readonly email!: string | null

  @Column('varchar')
  readonly name!: string | null

  @Column('varchar', { default: 'Etc/UTC' })
  readonly timeZone!: string | null

  @Column('varchar', { select: false })
  @Exclude()
  readonly password!: string | null

  @Column('varchar', {
    select: false,
    nullable: true,
  })
  @Exclude()
  readonly refreshTokenHash!: string | null
}
