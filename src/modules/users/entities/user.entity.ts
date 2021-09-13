import { Column, Entity } from 'typeorm'
import { Exclude } from 'class-transformer'
import { Base } from 'src/modules/database/base.abstract.entity'

/**
 * User entity.
 *
 * The `password` and `refreshTokenHash` properties are TypeORM "hidden columns" that are excluded from queries
 * with `select: false` to help safeguard against these protected values from being logged, returned in responses, etc.
 *
 * The `password` and `refreshTokenHash` fields must be explicitly selected with the query builder's `addSelect()` method
 * where the data is required, such as functions related to authentication.
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

  @Exclude()
  @Column('varchar', { select: false })
  readonly password!: string | null

  @Exclude()
  @Column('varchar', {
    select: false,
    nullable: true,
  })
  readonly refreshTokenHash!: string | null
}
