import { Module } from '@nestjs/common';
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
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderSseGateway],
  exports: [OrdersService, OrderSseGateway],
})
export class OrdersModule {}
