import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    // 1. Tự động tìm 1 user trong DB để gán cho đơn hàng (tránh lỗi 500 do sai ID)
    const user = await this.prisma.user.findFirst();
    if (!user) throw new BadRequestException('Chưa có user nào trong DB. Hãy chạy seed data.');

    let total = 0;
    const orderItems = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new BadRequestException('Sản phẩm không tồn tại');
      if (product.stock < item.qty) throw new BadRequestException(`Sản phẩm ${product.name} không đủ hàng`);

      const lineTotal = product.price * item.qty;
      total += lineTotal;
      
      orderItems.push({ 
        productId: item.productId, 
        size: item.size, 
        qty: item.qty, 
        unitPrice: product.price, 
        lineTotal 
      });
    }

    // 2. Lưu đơn hàng
    return this.prisma.order.create({
      data: { 
        userId: user.id, // Lấy ID của user vừa tìm được
        total, 
        status: 'PENDING', 
        items: { create: orderItems } 
      },
      include: { items: true },
    });
  }

  async findMyOrders() {
    const user = await this.prisma.user.findFirst();
    if (!user) return [];
    
    return this.prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}