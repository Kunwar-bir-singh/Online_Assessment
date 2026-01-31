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
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: any,
  ) {
    const user_id = req.user?.id;
    
    return this.ordersService.create(createOrderDto, user_id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Request() req: any) {
    const user_id = req?.user?.id;
    return this.ordersService.findAll(user_id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string, @Request() req: any) {
    const user_id = req?.user?.id;
    return this.ordersService.findOneWithDetails(+id, user_id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    const user_id = req?.user?.id;
    return this.ordersService.updateStatus(+id, updateStatusDto, user_id);
  }

  // SSE stream endpoint - uses token in query param since EventSource can't send headers
  @Get(':id/stream')
  async getOrderStream(
    @Param('id') order_id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    return this.ordersService.getOrdersStream(res, token, order_id);
  }
}
