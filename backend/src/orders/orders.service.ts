import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // Hàm phụ trợ tính hệ số size
  private getSizeMultiplier(size: string) {
    if (size === 'S') return 0.8;
    if (size === 'L') return 1.2;
    return 1.0;
  }

  async create(dto: CreateOrderDto) {
    const user = await this.prisma.user.findFirst();
    if (!user) throw new BadRequestException('Chưa có user trong DB');

    let total = 0;
    const orderItems: any[] = [];

    // 1. Kiểm tra sản phẩm, nguyên liệu và tính tiền
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { recipes: true },
      });
      if (!product) throw new BadRequestException('Sản phẩm không tồn tại');

      const multiplier = this.getSizeMultiplier(item.size);

      // Kiểm tra kho nguyên liệu (Chỉ kiểm tra, chưa trừ)
      for (const recipe of product.recipes) {
        const ingredient = await this.prisma.ingredient.findUnique({ where: { id: recipe.ingredientId } });
        const neededAmount = recipe.amount * multiplier * item.qty;
        if (!ingredient || ingredient.stock < neededAmount) {
          throw new BadRequestException(`Hết nguyên liệu làm món ${product.name} (Size ${item.size})`);
        }
      }

      // Tính tiền topping
      let toppingPriceTotal = 0;
      const itemToppingsData: any[] = [];
      if (item.toppingIds && item.toppingIds.length > 0) {
        const toppings = await this.prisma.topping.findMany({ where: { id: { in: item.toppingIds } } });
        for (const topping of toppings) {
          toppingPriceTotal += topping.price;
          itemToppingsData.push({ toppingId: topping.id, price: topping.price });
        }
      }

      const finalProductPrice = Math.round(product.price * multiplier); 
      const lineTotal = (finalProductPrice + toppingPriceTotal) * item.qty;
      total += lineTotal;
      
      orderItems.push({ 
        productId: item.productId, size: item.size, qty: item.qty, 
        unitPrice: finalProductPrice, lineTotal,
        toppings: { create: itemToppingsData }
      });
    }

    // 2. Tạo đơn hàng (Chưa trừ kho)
    return this.prisma.order.create({
      data: { 
        userId: user.id, total, status: 'PENDING', 
        items: { create: orderItems },
        receiverName: dto.receiverName, receiverPhone: dto.receiverPhone, deliveryAddress: dto.deliveryAddress,
      },
      include: { items: { include: { toppings: true } } },
    });
  }

  // API cập nhật đơn sang PAID và TRỪ KHO (Gia Hân gọi khi thanh toán xong)
  async markAsPaid(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: { include: { recipes: true } } } } }
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.status !== 'PENDING') throw new BadRequestException('Đơn hàng không ở trạng thái chờ thanh toán');

    // Cập nhật trạng thái và trừ kho
    return this.prisma.$transaction(async (prisma) => {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      for (const item of order.items) {
        const multiplier = this.getSizeMultiplier(item.size);
        // Trừ kho nguyên liệu
        for (const recipe of item.product.recipes) {
          const amountToSubtract = recipe.amount * multiplier * item.qty;
          await prisma.ingredient.update({
            where: { id: recipe.ingredientId },
            data: { stock: { decrement: amountToSubtract } },
          });
        }
        // Cộng lượt bán
        await prisma.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.qty } },
        });
      }
      return updatedOrder;
    });
  }

  // API Hủy đơn (CHỈ KHI PAID)
  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ 
      where: { id: orderId },
      include: { items: { include: { product: { include: { recipes: true } } } }, payments: true } 
    });
    
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // Chỉ cho phép hủy khi PAID
    if (order.status !== 'PAID') {
      throw new BadRequestException('Chỉ có thể hủy đơn hàng khi đã thanh toán (PAID).');
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Hoàn kho và hoàn lượt bán
      for (const item of order.items) {
        const multiplier = this.getSizeMultiplier(item.size);
        for (const recipe of item.product.recipes) {
          const amountToRefund = recipe.amount * multiplier * item.qty;
          await prisma.ingredient.update({
            where: { id: recipe.ingredientId },
            data: { stock: { increment: amountToRefund } },
          });
        }
        await prisma.product.update({
          where: { id: item.productId },
          data: { soldCount: { decrement: item.qty } },
        });
      }

      // 2. Hoàn tiền (Mock)
      const payment = order.payments[0];
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' } 
        });
      }
      console.log(`[MOCK REFUND] Đã hoàn tiền và hoàn kho cho đơn ${orderId}`);

      // 3. Đổi trạng thái đơn sang CANCELLED
      return prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    });
  }

  async findMyOrders() {
    const user = await this.prisma.user.findFirst();
    if (!user) return [];
    return this.prisma.order.findMany({
      where: { userId: user.id },
      include: { items: { include: { toppings: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}