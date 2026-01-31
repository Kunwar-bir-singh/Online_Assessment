import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { OrderSseGateway } from './events/order-sse.gateway';

interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
}

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderSseGateway: OrderSseGateway,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    const user = req.user as AuthenticatedUser;
    const order = await this.ordersService.create(createOrderDto, user.id);
    return {
      success: true,
      message: 'Order created successfully',
      data: order,
    };
  }

  @Get()
  async findAll(@Request() req: any) {
    const user = req.user as AuthenticatedUser;
    const orders = await this.ordersService.findAll(user.id);
    return {
      success: true,
      data: orders,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const user = req.user as AuthenticatedUser;
    const order = await this.ordersService.findOne(+id);

    // Verify order belongs to user
    if (order.user_id !== user.id) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    return {
      success: true,
      data: order,
    };
  }


 // api to get the SSE stream
  @Get(':id/stream')
  async getOrderStream(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const user = req.user as AuthenticatedUser;
    const order = await this.ordersService.findOne(+id);

    // Verify order belongs to user
    if (order.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Get SSE stream
    this.orderSseGateway.getOrderUpdatesStream(user.id, res);

    //  client disconnect
    req.on('close', () => {
      res.end();
    });
  }
}
