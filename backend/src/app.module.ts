import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
     SequelizeModule.forRoot({
      dialect: 'postgres',
      host: '' + process.env.DB_HOST ,
      port: parseInt(process.env.DB_PORT ?? '16345', 10),
      username: '' + process.env.DB_USER ,
      password: '' + process.env.DB_PASSWORD ,
      database: '' + process.env.DB_NAME ,
      autoLoadModels: true,
      sync: { alter : true }, 
      logging: console.log,
      timezone: '+05:30',
      retry: {
        max: 3,
        timeout: 3000,
      },
    }),
    AuthModule,
    OrdersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
