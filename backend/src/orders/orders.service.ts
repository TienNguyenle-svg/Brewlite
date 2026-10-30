import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const user = await this.prisma.user.findFirst();
    if (!user) throw new BadRequestException('Chưa có user trong DB');

    let total = 0;
    const orderItems: any[] = [];

    // Hàm tính hệ số Size (Mặc định công thức là M)
    const getSizeMultiplier = (size: string) => {
      if (size === 'S') return 0.8;
      if (size === 'L') return 1.2;
      return 1.0; // Size M
    };

    // 1. Kiểm tra nguyên liệu trong kho
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { recipes: true },
      });
      
      if (!product) throw new BadRequestException('Sản phẩm không tồn tại');

      const multiplier = getSizeMultiplier(item.size);

      // Duyệt công thức để xem nguyên liệu có đủ không
      for (const recipe of product.recipes) {
        const ingredient = await this.prisma.ingredient.findUnique({
          where: { id: recipe.ingredientId },
        });
        
        // Lượng cần = Định lượng gốc * Hệ số size * Số lượng
        const neededAmount = recipe.amount * multiplier * item.qty;
        if (!ingredient || ingredient.stock < neededAmount) {
          throw new BadRequestException(`Hết nguyên liệu để làm món ${product.name} (Size ${item.size})`);
        }
      }

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

    // 2. Tạo đơn và trừ kho nguyên liệu
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.create({
        data: { userId: user.id, total, status: 'PENDING', items: { create: orderItems } },
        include: { items: true },
      });

      for (const item of dto.items) {
        // [MỚI] Cộng lượt bán (Sold Count) cho sản phẩm
        await prisma.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.qty } },
        });

        // Trừ nguyên liệu kho
        const product = await prisma.product.findUnique({
          where: { id: item.productId }, include: { recipes: true }
        });
        
        if (product) {
          const multiplier = getSizeMultiplier(item.size);
          for (const recipe of product.recipes) {
            const amountToSubtract = recipe.amount * multiplier * item.qty;
            await prisma.ingredient.update({
              where: { id: recipe.ingredientId },
              data: { stock: { decrement: amountToSubtract } },
            });
          }
        }
      }
      return order;
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