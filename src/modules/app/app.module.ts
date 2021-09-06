import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import appConfig from 'src/config/app.config'
import authConfig from 'src/config/auth.config'
// import { DatabaseModule } from '../database/database.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    // @see - https://docs.nestjs.com/techniques/configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig],
    }),
    // DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
