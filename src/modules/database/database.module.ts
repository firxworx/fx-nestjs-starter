import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST') ?? 'localhost',
        port: configService.get('POSTGRES_PORT') ?? 5432,
        database: configService.get('POSTGRES_DB'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        entities: [__dirname + '/../**/*.entity.{js,ts}'], // reminder: static glob paths will not work with webpack
        //
        // run migrations automatically (disable if you prefer to run manually)
        // migrationsRun: true,
        //
        // include both ts + js extensions to support both dev and prod usage
        // migrations: [__dirname + '/migrations/**/*.{ts,js}],
        //
        // subscribers: [],
        //
        // @todo - synchronize for dev only - remove for production and use migrations instead
        synchronize: true,
        //
        // logging: true/false,
        // logger: 'file'
        //
        // note: migrations under src/ folder will be compiled into dist/ folder
        cli: {
          // entitiesDir: '',
          // subscribersDir: ''
          migrationsDir: 'src/migrations',
        },
      }),
    }),
  ],
  exports: [],
})
export class DatabaseModule {}
