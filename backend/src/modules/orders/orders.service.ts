import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { OrdersModel } from 'src/models/orders.model';
import { OrdersItemsModel } from 'src/models/orders_items.model';
import { OrdersStatusModel } from 'src/models/orders_status.model';
import { ProductsModel } from 'src/models/products.model';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { OrderSseGateway } from './events/order-sse.gateway';
import { Sequelize } from 'sequelize-typescript';

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
    private readonly sequelize: Sequelize,
    private readonly jwtService: JwtService,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    user_id: number,
  ): Promise<OrdersModel> {
    const transaction = await this.sequelize.transaction();

    try {
      let totalAmount = 0;
      const orderItems: any[] = [];

      for (const item of createOrderDto.items) {
        const product = await this.productsModel.findOne({
          where: { product_id: item.product_id },
          raw: true,
        });

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

      // Create the main order
      const orderRaw = await this.ordersModel.create(
        {
          user_id: user_id,
          status: ORDER_STATUS.PENDING,
          total_amount: totalAmount,
        } as any,
        { transaction },
      );

      const order = orderRaw.get({ plain: true });

      // Create the order items
      for (const item of orderItems) {
        await this.ordersItemsModel.create(
          {
            order_id: order.order_id,
            ...item,
          } as any,
          { transaction },
        );
      }

      await this.ordersStatusModel.create(
        {
          order_id: order.order_id,
          status: ORDER_STATUS.PENDING,
        } as any,
        { transaction },
      );

      await transaction.commit();

      // Schedule status progression
      this.scheduleStatusProgression(order.order_id!, user_id);

      return this.findOne(order.order_id!);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  private scheduleStatusProgression(order_id: number, user_id: number): void {
    // After 3 seconds: Confirmed
    setTimeout(() => {
      this.simulateStatusUpdate(order_id, ORDER_STATUS.CONFIRMED, user_id);
    }, 3000);

    // After 6 seconds: Preparing
    setTimeout(() => {
      this.simulateStatusUpdate(order_id, ORDER_STATUS.PREPARING, user_id);
    }, 6000);

    // After 9 seconds: Ready
    setTimeout(() => {
      this.simulateStatusUpdate(order_id, ORDER_STATUS.READY, user_id);
    }, 9000);

    // After 12 seconds: Out for Delivery
    setTimeout(() => {
      this.simulateStatusUpdate(
        order_id,
        ORDER_STATUS.OUT_FOR_DELIVERY,
        user_id,
      );
    }, 12000);

    // After 15 seconds: Delivered
    setTimeout(() => {
      this.simulateStatusUpdate(order_id, ORDER_STATUS.DELIVERED, user_id);
    }, 15000);
  }

  async findAll(user_id?: number): Promise<OrdersModel[]> {
    try {
      const whereClause = user_id ? { user_id: user_id } : {};
      return await this.ordersModel.findAll({
        where: whereClause,
        include: [
          { model: OrdersItemsModel, include: [ProductsModel] },
          { model: OrdersStatusModel },
        ],
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  async findOne(id: number): Promise<OrdersModel> {
    try {
      const order = await this.ordersModel.findOne({
        where: { order_id: id },
        attributes: ['order_id', 'user_id', 'status', 'total_amount'],
        raw: true,
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      return order;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  async findOneWithDetails(id: number, user_id: number): Promise<OrdersModel> {
    try {
      const order = await this.ordersModel.findOne({
        where: { order_id: id },
        raw : true
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      if (order.user_id !== user_id) {
        throw new ForbiddenException(
          'You do not have permission to view this order',
        );
      }

      return order;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new Error(`Failed to fetch order details: ${error.message}`);
    }
  }

  async updateStatus(
    id: number,
    updateStatusDto: UpdateOrderStatusDto,
    user_id: number,
  ): Promise<OrdersModel> {
    const transaction = await this.sequelize.transaction();
    try {
      const order = await this.findOne(id);

      if (order.user_id !== user_id) {
        throw new ForbiddenException(
          'You do not have permission to update this order',
        );
      }

      // Update order status
      await this.ordersModel.update({ status: updateStatusDto.status } as any, {
        where: { order_id: id },
        transaction,
      });

      // Create status history record
      await this.ordersStatusModel.create(
        {
          order_id: id,
          status: updateStatusDto.status,
        } as any,
        { transaction },
      );

      // Send SSE notification
      const statusMessages: Record<string, string> = {
        [ORDER_STATUS.CONFIRMED]:
          'Your order has been confirmed by the restaurant',
        [ORDER_STATUS.PREPARING]: 'The restaurant is now preparing your order',
        [ORDER_STATUS.READY]: 'Your order is ready and waiting for pickup',
        [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Your order is out for delivery',
        [ORDER_STATUS.DELIVERED]:
          'Your order has been delivered. Enjoy your meal!',
        [ORDER_STATUS.CANCELLED]: 'Your order has been cancelled',
      };

      this.orderSseGateway.sendToUser(user_id, {
        order_id: order.order_id!,
        status: updateStatusDto.status,
        timestamp: new Date(),
        message:
          statusMessages[updateStatusDto.status] ||
          `Order status updated to ${updateStatusDto.status}`,
      });

      await transaction.commit();
      return await this.findOne(id);
    } catch (error) {
      await transaction.rollback();
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  async getOrdersStream(
    res: any,
    token: string,
    order_id: string,
  ): Promise<void> {
    // Validate JWT token and extract user_id
    let user_id: number;
    try {
      const payload = this.jwtService.verify<{ sub: number }>(token, {
        secret: process.env.JWT_SECRET ,
      });
      user_id = payload.sub;

    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Verify order exists and belongs to this user
    const order = await this.findOne(+order_id);
    
    if (order.user_id !== user_id) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Get SSE stream and send current order status
    this.orderSseGateway.getOrderUpdatesStream(user_id, res, order);

    // Handle client disconnect
    res.on('close', () => {
      res.end();
    });
  }

  private async simulateStatusUpdate(
    order_id: number,
    status: string,
    user_id: number,
  ): Promise<void> {
    try {
      const order = await this.ordersModel.findOne({ where: { order_id } });
      if (order && order.status !== ORDER_STATUS.CANCELLED) {
        await this.ordersModel.update({ status } as any, {
          where: { order_id },
        });

        await this.ordersStatusModel.create({
          order_id: order_id,
          status,
        } as any);

        const statusMessages: Record<string, string> = {
          [ORDER_STATUS.CONFIRMED]:
            'Your order has been confirmed by the restaurant',
          [ORDER_STATUS.PREPARING]:
            'The restaurant is now preparing your order',
          [ORDER_STATUS.READY]: 'Your order is ready and waiting for pickup',
          [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Your order is out for delivery',
          [ORDER_STATUS.DELIVERED]:
            'Your order has been delivered. Enjoy your meal!',
        };

        this.orderSseGateway.sendToUser(user_id, {
          order_id,
          status,
          timestamp: new Date(),
          message:
            statusMessages[status] || `Order status updated to ${status}`,
        });
      }
    } catch (error) {
      console.error(`Failed to simulate status update: ${error.message}`);
    }
  }
}
