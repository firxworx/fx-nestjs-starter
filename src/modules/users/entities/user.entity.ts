import { Column, Entity } from 'typeorm'
import { Exclude } from 'class-transformer'
import { BaseAbstractEntity } from 'src/modules/database/base.abstract.entity'
import { ApiHideProperty } from '@nestjs/swagger'

/**
 * User entity.
 *
 * The `password` and `refreshTokenHash` properties are TypeORM hidden columns that are excluded from queries
 * by specifying `select: false`. This safeguards against these sensitive values from being returned to clients, logged, etc.
 *
 * The `password` and `refreshTokenHash` fields must be explicitly selected in queries using query builder's `addSelect()` method,
 * for example by the appropriate authorization/validation function implementations.
 *
 * @see {@link https://typeorm.io/#/select-query-builder/hidden-columns}
 */
@Entity()
export class User extends BaseAbstractEntity {
  @Column('varchar', { unique: true })
  readonly email!: string

  @Column('varchar')
  readonly name!: string

  @Column('varchar', { default: 'Etc/UTC' })
  readonly timeZone!: string

  @ApiHideProperty()
  @Exclude()
  @Column('varchar', { select: false })
  readonly password!: string | null

  @ApiHideProperty()
  @Exclude()
  @Column('varchar', {
    select: false,
    nullable: true,
  })
  readonly refreshTokenHash!: string | null
}
