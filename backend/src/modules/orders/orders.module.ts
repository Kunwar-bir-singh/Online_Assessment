import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersModel } from 'src/models/orders.model';
import { OrdersItemsModel } from 'src/models/orders_items.model';
import { OrdersStatusModel } from 'src/models/orders_status.model';
import { ProductsModel } from 'src/models/products.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrderSseGateway } from './events/order-sse.gateway';

@Module({
  imports: [
    SequelizeModule.forFeature([
      OrdersModel,
      OrdersStatusModel,
      OrdersItemsModel,
      ProductsModel,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderSseGateway],
  exports: [OrdersService, OrderSseGateway],
})
export class OrdersModule {}
