import { Exclude } from 'class-transformer'
import { Column } from 'typeorm'

/**
 * Abstract entity that defines `createdBy` and `updatedBy` audit fields.
 */
export abstract class Audit {
  @Exclude()
  @Column({ type: 'varchar', length: 300 })
  createdBy!: string

  @Exclude()
  @Column({ type: 'varchar', length: 300 })
  updatedBy!: string
}
