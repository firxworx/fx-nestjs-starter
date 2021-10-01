# TypeORM Configuration with NestJS

The project boilerplate is configured for typeorm + postgres.

The typeorm configuration located at `src/ormconfig.ts` is used by both the nestjs app and the typeorm cli.

- For app usage refer to the source of the `DatabaseModule` in `src/modules/database/database.module.ts`
- For cli usage refer to `scripts` in `package.json`

The configuration file defines key settings including the database `host`, `port`, `username`, and `password`.

## TypeORM configuration

It is a popular practice to place the typeorm configuration file (`ormconfig.{js,ts,json}`) in the project repo's root folder rather than under `src/`. If it is in the root folder, typeorm will automatically detect the file and read in the configuration.

This project houses the typeorm config under `src/` instead so that it does not alter the folder structure of the compiled `dist/` folder when used with a stock typescript configuration (`tsconfig.json`). If the config file were in the project root and was referenced by code within `src/` then nestjs-related code under `src` would be compiled to `dist/src` vs. `dist/`, thus breaking other common conventions and path assumptions found in nestjs projects (e.g. `start`-related scripts in `package.json`).

If you would like to use a `tsconfig.json` file in project root and then add nestjs-specific properties within the `DatabaseModule`, use the following approach with `getConnectionOptions()` to have typeorm read its config. This is documented in the nestjs docs for `@nestjs/typeorm` as follows:

```ts
useFactory: async () => Object.assign(await getConnectionOptions(), { autoLoadEntities: true, })
```

### Environment variables

Note that typeorm can also be configured via environment variables (relevant variable names are prefixed with: `TYPEORM_`). Refer to the typeorm docs if you would like to use environment variables instead of a file-based configuration. 

### Types

The type of the config exported from `src/ormconfig.ts` is an intersection type consisting of `ConnectionOptions` as exported by `typeorm` combined with the optional `seeds` and `factories` properties from `ConnectionOptions` as exported by `typeorm-seeding`.

In `src/modules/database/database.module.ts` the typeorm config is combined with nestjs-specific properties to produce a final configuration object of type `TypeOrmModuleOptions`.

## DatabaseModule configuration

If you need to load any configuration parameters from `ConfigService`, it can be injected by using `TypeOrmModule.forRootAsync()` in the module `imports` array in place of `TypeOrmModule.forRoot()` and using the `useFactory()` method as follows:

If you need to load anything from `ConfigService` w/ process.env.* variables populated from an .env file,
an alternative is to use + `useFactory()`.

e.g. in `imports` array above, instead of `TypeOrmModule.forRoot()`:

```ts
@Module({
  // ...
  TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      // you can now use `configService` here, for example: 
      // const databaseConfig = configService.get<TypeOrmModuleAsyncOptions>('database')
      // ...
      return ormconfig // as TypeOrmModuleOptions
    },
  })
  // ...
})
```

In the above example an `import: [ConfigModule]` property is not required alongside the `inject` because this project imports `ConfigModule` globally via `AppModule` and the `ConfigModule` is loaded before `DatabaseModule` in the `AppModule`.
