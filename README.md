# fx-nestjs-starter (WIP)

This project is an opinionated basic starter ("boilerplate") for API's implemented with the [NestJS](https://nestjs.com/) framework powered by [Express](https://expressjs.com/). The code builds on the foundation generated by the nestjs cli and includes additional features and configuration common to many projects.

The code features numerous descriptive comments + direct links to relevant docs, to support scenarios related to business, consulting, and education.

The goal of this repo is to provide a reference NestJS API that helps developers save time when starting new projects. 

To use code from this repo, search for comments tagged with `@starter` to identify decision points that should be reviewed and customized on a per-project basis:

```bash
# run the following from the project root folder:

grep -r "@starter" src/
```

### App features

- nestjs powered by express (vs. fastify) to enable access to the ecosystem of Express middleware
- improved `tsconfig.json` vs. nestjs boilerplate
  - includes `strict: true` to realize the full benefit of TypeScript
  - lib includes `es2019` for features like `array.flat()`
- configuration via idomatic @nestjs/config (refer to `src/config`)
- auth module with local + JWT + JWT refresh token strategies
  - implemented with `@nestjs/passport`
  - `http-only` cookies store `Authorization` and `Refresh` JWT's for security
  - express `cookie-parser` library is configured in `src/main.ts`
- database module powered by TypeORM + postgres, featuring a TypeScript `ormconfig.ts` file with cli support
  - includes decorators to support pagination
- aws module implemented with **@aws-sdk v3** that includes an aws-ses service for sending emails and aws-s3 for storage
- support for swagger/openapi including the optional nestjs cli plugin provided by `@nestjs/swagger`
- logging with pino via nestjs-pino for a nestjs-compatible logger that logs requests + responses and outputs json
- optional rate limiting with `@nestjs/throttler` (enabled via environment variable)

### Workflow and deployment features

- Dockerized with a `Dockerfile` and `docker-compose.yml` file

### Tips for basing a project on this starter

If you choose to base your project on a fork or copy of this repo:

- In `package.json` revise the `name`, `description`, `version`, `author`, `license`, `private`, etc. to suit your project
- Replace or delete the `LICENSE` file as required
- Search the repo for the `@starter` tag (e.g. run `grep -r "@starter" src/` from the project root folder), review the comments, and customize the project to suit your needs

It is recommended that you upgrade all package dependency versions in `package.json` prior to commencing development on your new project. Run `yarn upgrade-interactive --latest` to review potential updates. Of course, please be aware that you may need to update code to accommodate any breaking changes that could be possibly introduced by package updates.

For documentation refer to:

- NestJS: <https://docs.nestjs.com/>
- TypeORM: <https://github.com/typeorm/typeorm/tree/master/docs>

## Development workflow

### Prerequisites

Ensure that your environment has the following dependencies installed: git, node, yarn, docker.

Note the scripts in `package.json` and potentially other libraries assume a linux/unix environment. Windows users are advised to run linux on WSL2 (most of this project was created on a PC running Ubuntu under WSL2).

### Install dependencies

Change to the project root folder and install package dependencies:

```bash
yarn
```

### Define environment variables

Create an `.env` file in the repository root folder based on a copy of the example `.env.sample` file.

By project convention, environment variables named with the suffix `_FLAG` are boolean properties that accept `1` (true) or `0` (false) values. Any value other than `1` will be interpreted as false.

### Run development database

To start the postgres database server defined in `docker-compose.yml` in daemon mode (so that it will run in the background), run:

```bash
yarn docker:postgres:up
```

To run database migrations:

```bash
yarn migration:run
```

_WIP_ - To seed the database with sample/dev data:

```bash
yarn seed:run
```

### Run application in dev mode

To run the application in dev mode configured to watch for file changes, run:

```bash
yarn start:dev
```

## TypeORM (WIP WIP WIP)

@todo - revised package.json so name is required to be added - either revert + test or document here

The TypeORM configuration file for this project is: `src/ormconfig.ts`.

The conventions are:

- entity filename extension: `*.entity.ts`
- subscriber filename extension: `*.subscriber.ts`

TypeORM will pick up `ormconfig.{json,js,ts}` in a project's root folder however placing it there can.

TYPEORM_CONNECTION (corresponds to the `type` property in an `ormconfig` file),
TYPEORM_HOST,
TYPEORM_PORT,
TYPEORM_USERNAME,
TYPEORM_PASSWORD,
TYPEORM_DATABASE,

```ts
    "typeorm": "ts-node -r tsconfig-paths/register node_modules/typeorm/cli.js --config src/ormconfig.ts",
    "migration:generate": "yarn run typeorm migration:generate -n",
    "migration:create": "yarn run typeorm migration:create -n",
    "migration:run": "yarn run typeorm migration:run",
    "migration:revert": "yarn run typeorm migration:revert",
```


### Generating migrations

After adding or revising entity classes, run the following command to generate migrations to update the database schema:

```sh
# replace "MigrationName" with a short and descriptive name for the migration (e.g. "UserTable")

yarn migration:generate MigrationName
```

The generated file will be added to `src/modules/database/migrations` per the config in `src/ormconfig.ts`.

### Creating migrations

To create a new empty migration with boilerplate/scaffold code, run:

```sh
# replace "MigrationName" with a short and descriptive name for the migration

yarn migration:create MigrationName
```

The newly created migration will contain `up()` and `down()` methods awaiting your implementation. TypeORM calls `up()` to perform the migration and `down()` to revert it. Both methods are passed an instance of `QueryRunner` that you can use to build migration queries by hand, or you can use the migration API.

For example: 

```ts
await queryRunner.query(`ALTER TABLE "user" RENAME "name" to "fullName"`);
```

### Running migrations

To run migrations via cli:

```sh
yarn migration:run
```

To run migrations in code, call the `runMigrations()` method on an instance of the typeorm Connection class (which reflects a connection to the database) in an async method:

```sh
await connection.runMigrations()
```

Also refer to the `migrationsRun` property in `src/ormconfig.ts`. When set to `true`, typeorm will automatically run migrations when the app is started and establishes a connection to the database.

### Reverting migrations

To revert migrations:

```sh
yarn migration:revert
```

### Removing TypeORM + Postgres

If your project does not require a database or if you would like to use a different database/ORM stack then it is easily removed:

To remove typeorm:

- Remove package dependencies: `yarn remove @nestjs/typeorm typeorm typeorm-seeding`
- Revise `package.json`: delete `typeorm` and `migration`-related entries from `scripts`

To remove postgres:

- Remove package dependencies: `yarn remove pg pg-protocol`
- Revise `docker-compose.yml`: comment out or delete the `postgres` service and remove it from the `api` service's `depends_on` list

In all cases:

- As applicable to your project, either remove `DatabaseModule` from the `imports` array in `src/modules/app/app.module.ts`, or revise the module as required to suit the needs of your project.

## OpenAPI/Swagger

OpenAPI/Swagger can be conditionally enabled to generate API documentation by setting the `OPENAPI_ENABLED_FLAG` environment variable to `1`. Refer to `config/app.config.ts` and `src/main.ts` for usage.

When enabled, the Swagger UI is available at URL path: `/api` (note: the path does not include the global prefix).

The opt-in nestjs cli plugin packaged with `@nestjs/swagger` is enabled for this project in `nest-cli.json`.

The plugin automatically adds OpenAPI/Swagger decorators to DTO's and entities, and it can pull values from `class-validator` decorators. This greatly reduces the maintenance burden and overall redundancy involved with adding decorators for both nestjs and OpenAPI/Swagger that essentially say the same thing.

Refer to the docs for more on the plugin and its myriad behaviours, available decorators, and configuration options: <https://docs.nestjs.com/openapi/cli-plugin>.

Among the various features and behaviours of this plugin include automatically applying the `@ApiProperty` decorator to all DTO + entity fields unless they are decorated with `@ApiHideProperty`.

The plugin adheres to nestjs conventions in its default configuration and will only analyze files with the following extensions: `.dto.ts` and `.entity.ts`.

### Limitations

The "Try it Out" feature is limited for this project API because Swagger UI + Swagger Editor does not currently support cookie authentication.  Refer to this issue: <https://github.com/swagger-api/swagger-js/issues/1163>

If you publish your docs to Swagger Hub, cookies are supported on that platform thanks to its particular implementation.

## Running the app

```bash
# development
yarn start

# development (watch mode)
yarn start:dev

# debug (watch mode)
yarn start:debug

# production
yarn start:prod
```

## Testing

```bash
# run unit tests
yarn test

# run e2e tests
yarn test:e2e

# compute test coverage
yarn test:cov
```

## License

Original code in the `fx-nestjs-starter` project is released under the Apache 2.0 license by author Kevin Firko (`@firxworx`).
