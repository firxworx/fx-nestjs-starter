import { Module } from '@nestjs/common'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'

import ormconfig from '../../ormconfig'
import { IsValidFilterConstraint } from './decorators/validation/is-valid-filter.validator'
import { IsValidSortConstraint } from './decorators/validation/is-valid-sort.validator'

const typeOrmModuleOptions: TypeOrmModuleOptions = {
  ...ormconfig,

  // @starter automatically load entities that are injected to modules via `TypeOrmModule.forFeature()`
  // refer to notes in ormconfig.ts header comment re webpack: setting to `true` may be required for projects in a monorepo
  autoLoadEntities: false,
}

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmModuleOptions)],
  exports: [],
  providers: [IsValidFilterConstraint, IsValidSortConstraint],
})
export class DatabaseModule {}
