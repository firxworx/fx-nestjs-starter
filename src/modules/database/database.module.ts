import { Module } from '@nestjs/common'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'

import ormconfig from '../../ormconfig'
import { QueryUtilsService } from './query-utils.service'

/**
 * Load ormconfig and specify additional options that are specific to nestjs+typeorm.
 *
 * @see ormconfig.ts for doc comment re webpack - setting `autoLoadEntities` to `true` may be required for projects in a monorepo,
 */
const typeOrmModuleOptions: TypeOrmModuleOptions = {
  ...ormconfig,

  // @starter - automatically load any entities that are injected to modules via `TypeOrmModule.forFeature()`
  autoLoadEntities: true,
}

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmModuleOptions)],
  exports: [QueryUtilsService],
  providers: [QueryUtilsService],
})
export class DatabaseModule {}
