import { Module } from '@nestjs/common'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'

import ormconfig from '../../ormconfig'

const typeOrmModuleOptions: TypeOrmModuleOptions = {
  ...ormconfig,

  // automatically load entities that are injected to modules via `TypeOrmModule.forFeature()`
  // refer to notes in ormconfig.ts header comment re webpack - this setting may be useful for projects in a monorepo
  autoLoadEntities: false,
}

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmModuleOptions)],
  exports: [],
})
export class DatabaseModule {}

/*
Additional Configuration Notes for TypeORM with NestJS:

If you need to load anything from `ConfigService` w/ process.env.* variables populated from an .env file,
an alternative is to use `TypeOrmModule.forRootAsync()` + `useFactory()`.

e.g. in `imports` array above, instead of `TypeOrmModule.forRoot()`:

```ts
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    // you can now use `configService` here
    // e.g. `configService.get<TypeOrmModuleAsyncOptions>('database')` as required

    // ...

    return ormconfig as TypeOrmModuleOptions
  },
})
```

Note that an `import: [ConfigModule]` entry is not required alongside the `inject: ...` entry in the above example because
in the case of this project, ConfigModule is already imported globally and is imported in the `AppModule` before `DatabaseModule`.

--

If you choose to use a typeorm-compatible ormconfig.{js,ts,json} in project root instead of under `src/` then it will
be automatically detected by typeorm.

Note that adopting this practice may change the folder structure of the dist/ folder with a stock `tsconfig.json`, particularly with js/ts files.
Compiled project files may end up in `dist/src` rather than `dist/`, thus breaking default `start` scripts and potentially other assumptions.

The type will be `ConnectionOptions` (as exported from typeorm). This will not include the nestjs-specific additions included in `TypeOrmModuleOptions`.

If you wish to have typeorm access the detected config and then add nestjs-specific properties, you can use the following
approach as covered in the nestjs docs (in `TypeOrmModule.forRootAsync()` method):

```ts
useFactory: async () => Object.assign(await getConnectionOptions(), { autoLoadEntities: true, })
```

--

Finally, typeorm recognizes a number of environment variables prefixed with `TYPEORM_`.

Refer to the typeorm docs if you wish to use them.
*/
