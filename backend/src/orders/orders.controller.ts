import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng mới (PENDING)' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Xem lịch sử đơn hàng' })
  getMyOrders() {
    return this.ordersService.findMyOrders();
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Khách hủy đơn (Chỉ khi PAID) và hoàn tiền, hoàn kho' })
  cancelOrder(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }

}