import * as dotenv from 'dotenv'
import { resolve, join } from 'path'

import type { ConnectionOptions } from 'typeorm'
import type { ConnectionOptions as TypeOrmSeedingConnectionOptions } from 'typeorm-seeding'
import { SnakeNamingStrategy } from './modules/database/snake-naming.strategy'

/**
 * dotenv is used directly to load environment vars from .env to support standalone usage with the typeorm cli.
 *
 * This file works independently of nestjs + its DI environment. Otherwise, if nestjs/config were used to house the
 * typeorm config then nestjs would be required to access it.
 *
 * Note that nestjs/config uses dotenv under the hood.
 *
 * Refer to `package.json` where this file is passed via `--config` flag to the `typeorm` script.
 */
dotenv.config({ path: resolve(process.cwd(), '.env') })

/**
 * Export TypeORM config `ConnectionOptions` with additional configuration properties from the typeorm-seeding package.
 *
 * This file will _not_ be automatically detected and read in by typeorm because it resides inside `src/` folder vs. project root.
 * This arrangement does not risk altering the default paths of the compiled `dist/` folder when using a stock nestjs `tsconfig.json`.
 *
 * As migrations reside under the `src/` folder (`src/modules/database/migrations`) they will be compiled to the `dist/` folder.
 *
 * Reminder: static glob paths in the following configuration will not work with webpack. This can affect monorepos, e.g. nx.
 * Consider using the nestjs-supported `autoLoadEntities()` feature instead of glob paths if this case applies to your project.
 * Refer to `DatabaseModule` imports for more.
 *
 * @starter - review ormconfig + typeorm configuration settings
 */
const ormconfig: ConnectionOptions & Partial<Pick<TypeOrmSeedingConnectionOptions, 'seeds' | 'factories'>> = {
  type: 'postgres' as const, // cast is required for appropriate typing (e.g. 'postgres' as 'postgres')
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: +(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  namingStrategy: new SnakeNamingStrategy(),

  // entities are loaded from the compiled dist/ folder containing js files
  entities: [join(__dirname, 'modules', '**/*.entity.js')],

  // run migrations automatically (disable if you prefer to run them manually)
  // migrationsRun: true,

  // migrations are compiled to the dist/ folder as js files
  migrations: [join(__dirname, 'modules/database/migrations/*.js')],

  // subscribers listen for entity events (@see https://github.com/typeorm/typeorm/blob/master/docs/listeners-and-subscribers.md)
  // subscribers: [],

  // typeorm-seeding configuration (@see `ConnectionOptions` as exported from typeorm-seeding for types)
  seeds: [join(__dirname, '/modules/database/seeds/**/*.js')],
  factories: [join(__dirname + '/modules/database/factories/**/*.js')],

  // the synchronize feature auto-generates schema + migrations (convenience option for development - unsafe for production because it can drop tables/data)
  synchronize: false,

  // the dropSchema feature drops the schema each time a connection is established (convenience option for development - unsafe for production because it can drop tables/data)
  dropSchema: false,

  // log queries to console in development
  logging: process.env.NODE_ENV === 'development',

  // optional debug mode in development
  // debug: process.env.NODE_ENV === 'development',

  cli: {
    entitiesDir: 'src/modules',
    migrationsDir: 'src/modules/database/migrations',
    // subscribersDir: ''
  },

  // connection options to be passed to underlying typeorm database driver (will be deprecated in future releases)
  extra: {
    // max: ... // maxConnections
    // ssl: ... // requires ca, key, cert
  },
}

// note: depending on your setup, you may need to `export = { ... }` vs. declaring and exporting a const as default
export default ormconfig
