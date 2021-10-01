import { Column, Entity } from 'typeorm'
import { Exclude } from 'class-transformer'
import { Base } from 'src/modules/database/base.abstract.entity'
import { ApiHideProperty } from '@nestjs/swagger'

/**
 * User entity.
 *
 * The `password` and `refreshTokenHash` properties are TypeORM "hidden columns" that are excluded from queries
 * with `select: false` to safeguard against these values from being accidentally logged, returned in responses, etc.
 *
 * The `password` and `refreshTokenHash` fields must be explicitly selected with the query builder's `addSelect()` method
 * whenever these values are required from the database, such as auth-related functions.
 *
 * @see {@link https://typeorm.io/#/select-query-builder/hidden-columns}
 */
@Entity()
export class User extends Base {
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
