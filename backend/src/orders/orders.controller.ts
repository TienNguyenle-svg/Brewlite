import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Bắt buộc đăng nhập
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng mới (PENDING)' })
  create(@Body() dto: CreateOrderDto, @Request() req: any) {
    const user = req.user;
    
    // Chặn Admin và Barista đặt hàng
    if (user.role !== 'CUSTOMER') {
      throw new ForbiddenException('Chỉ khách hàng mới có quyền đặt hàng');
    }

    // Truyền ID của user đang đăng nhập vào service
    return this.ordersService.create(dto, user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Xem lịch sử đơn hàng' })
  getMyOrders(@Request() req: any) {
    return this.ordersService.findMyOrders(req.user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Khách hủy đơn (Chỉ khi PAID) và hoàn tiền, hoàn kho' })
  cancelOrder(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
}