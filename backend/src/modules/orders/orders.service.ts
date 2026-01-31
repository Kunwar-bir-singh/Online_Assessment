import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OrdersModel } from 'src/models/orders.model';
import { OrdersItemsModel } from 'src/models/orders_items.model';
import { OrdersStatusModel } from 'src/models/orders_status.model';
import { ProductsModel } from 'src/models/products.model';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { OrderSseGateway } from './events/order-sse.gateway';

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(OrdersModel)
    private ordersModel: typeof OrdersModel,
    @InjectModel(OrdersItemsModel)
    private ordersItemsModel: typeof OrdersItemsModel,
    @InjectModel(OrdersStatusModel)
    private ordersStatusModel: typeof OrdersStatusModel,
    @InjectModel(ProductsModel)
    private productsModel: typeof ProductsModel,
    private orderSseGateway: OrderSseGateway,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    user_id: number,
  ): Promise<OrdersModel> {
    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of createOrderDto.items) {
      const product = await this.productsModel.findByPk(item.product_id);
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.product_id} not found`,
        );
      }

      const priceThen = parseFloat(product.price);
      totalAmount += priceThen * item.quantity;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price_then: priceThen,
      });
    }

    // create the main order
    const order = await this.ordersModel.create({
      user_id: user_id,
      status: ORDER_STATUS.PENDING,
      total_amount: totalAmount,
    } as any);

    // create the order items
    for (const item of orderItems) {
      await this.ordersItemsModel.create({
        order_id: order.order_id,
        ...item,
      } as any);
    }

    await this.ordersStatusModel.create({
      order_id: order.order_id,
      status: ORDER_STATUS.PENDING,
    } as any);

    // notify via SSE - Order placed
    this.orderSseGateway.sendToUser(user_id, {
      order_id: order.order_id!,
      status: ORDER_STATUS.PENDING,
      timestamp: new Date(),
      message: 'Your order has been placed successfully',
    });

    // trying to simulate status: Pending -> Confirmed -> Preparing -> Ready -> Out for Delivery -> Delivered
    this.scheduleStatusProgression(order.order_id!, user_id);


    return this.findOne(order.order_id!);
  }

  private scheduleStatusProgression(order_id: number, user_id: number): void {
    // After 5 seconds: Confirmed
    setTimeout(() => {
      this.simulateStatusUpdate(order_id, ORDER_STATUS.CONFIRMED, user_id);
    }, 3000);

    // After 10 seconds: Preparing
    setTimeout(() => {
      this.simulateStatusUpdate(order_id, ORDER_STATUS.PREPARING, user_id);
    }, 3000);

    // After 20 seconds: Ready
    setTimeout(() => {
      this.simulateStatusUpdate(order_id, ORDER_STATUS.READY, user_id);
    }, 3000);

    // After 30 seconds: Out for Delivery
    setTimeout(() => {
      this.simulateStatusUpdate(
        order_id,
        ORDER_STATUS.OUT_FOR_DELIVERY,
        user_id,
      );
    }, 3000);

    // After 45 seconds: Delivered
    setTimeout(() => {
      this.simulateStatusUpdate(order_id, ORDER_STATUS.DELIVERED, user_id);
    }, 3000);
  }

  async findAll(user_id?: number): Promise<OrdersModel[]> {
    const whereClause = user_id ? { user_id: user_id } : {};
    return this.ordersModel.findAll({
      where: whereClause,
      include: [
        { model: OrdersItemsModel, include: [ProductsModel] },
        { model: OrdersStatusModel },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: number): Promise<OrdersModel> {
    const order = await this.ordersModel.findByPk(id, {
      include: [
        { model: OrdersItemsModel, include: [ProductsModel] },
        { model: OrdersStatusModel },
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }



  private async simulateStatusUpdate(
    order_id: number,
    status: string,
    user_id: number,
  ): Promise<void> {
    const order = await this.ordersModel.findByPk(order_id);
    if (order && order.status !== ORDER_STATUS.CANCELLED) {
      await order.update({ status } as any);

      await this.ordersStatusModel.create({
        order_id: order_id,
        status,
      } as any);

      const statusMessages: Record<string, string> = {
        [ORDER_STATUS.CONFIRMED]:
          'Your order has been confirmed by the restaurant',
        [ORDER_STATUS.PREPARING]: 'The restaurant is now preparing your order',
        [ORDER_STATUS.READY]: 'Your order is ready and waiting for pickup',
        [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Your order is out for delivery',
        [ORDER_STATUS.DELIVERED]:
          'Your order has been delivered. Enjoy your meal!',
      };

      this.orderSseGateway.sendToUser(user_id, {
        order_id,
        status,
        timestamp: new Date(),
        message: statusMessages[status] || `Order status updated to ${status}`,
      });
    }
  }
}
