import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private getSizeMultiplier(size: string) {
    if (size === 'S') return 0.8;
    if (size === 'L') return 1.2;
    return 1.0;
  }

  async create(dto: CreateOrderDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User không hợp lệ');

    let subTotal = 0;
    const orderItems: any[] = [];

    // 1. Tính tiền món (GIỮ NGUYÊN)
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { recipes: true },
      });
      if (!product) throw new BadRequestException('Sản phẩm không tồn tại');

      const multiplier = this.getSizeMultiplier(item.size);

      for (const recipe of product.recipes) {
        const ingredient = await this.prisma.ingredient.findUnique({ where: { id: recipe.ingredientId } });
        const neededAmount = recipe.amount * multiplier * item.qty;
        if (!ingredient || ingredient.stock < neededAmount) {
          throw new BadRequestException(`Hết nguyên liệu làm món ${product.name} (Size ${item.size})`);
        }
      }

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
      subTotal += lineTotal;
      
      orderItems.push({ 
        productId: item.productId, size: item.size, qty: item.qty, 
        unitPrice: finalProductPrice, lineTotal,
        toppings: { create: itemToppingsData }
      });
    }

    // 2. Xử lý mã khuyến mãi (GIỮ NGUYÊN)
    let discountAmount = 0;
    let promotionId = null;

    if (dto.promotionCode) {
      const promo = await this.prisma.promotion.findUnique({
        where: { code: dto.promotionCode },
      });

      if (!promo || !promo.active || (promo.expiredAt && promo.expiredAt < new Date())) {
        throw new BadRequestException('Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
      }
      if (subTotal < promo.minOrder) {
        throw new BadRequestException(`Đơn hàng chưa đạt giá trị tối thiểu ${promo.minOrder}đ để dùng mã này`);
      }

      if (promo.type === 'PERCENT') {
        discountAmount = Math.round((subTotal * promo.discount) / 100);
      } else {
        discountAmount = promo.discount;
      }
      promotionId = promo.id;
    }

    // 3. XỬ LÝ ĐIỂM THƯỞNG (MỚI)
    let pointsDiscount = 0;
    let pointsUsed = 0;
    if (dto.pointsToUse && dto.pointsToUse > 0) {
      if (user.loyaltyPoints < dto.pointsToUse) {
        throw new BadRequestException('Bạn không đủ điểm thưởng');
      }
      pointsUsed = dto.pointsToUse;
      pointsDiscount = pointsUsed * 1000; // Quy ước 1 điểm = 1000 VNĐ
      if (pointsDiscount > subTotal) pointsDiscount = subTotal;
    }

    // 4. Tính phí ship và tổng tiền (Cập nhật lại)
    const shippingFee = subTotal >= 100000 ? 0 : 15000;
    const finalTotal = subTotal - discountAmount - pointsDiscount + shippingFee;

    // 5. Tạo đơn hàng (Cập nhật lại data)
    return this.prisma.$transaction(async (prisma) => {
      const newOrder = await prisma.order.create({
        data: { 
          userId: user.id, 
          total: finalTotal,
          shippingFee: shippingFee,
          discountAmount: discountAmount + pointsDiscount, // Cộng dồn giảm giá
          status: 'PENDING', 
          items: { create: orderItems },
          receiverName: dto.receiverName, 
          receiverPhone: dto.receiverPhone, 
          deliveryAddress: dto.deliveryAddress,
          promotionId: promotionId,
        },
        include: { items: { include: { toppings: true } } },
      });

      // Trừ điểm user ngay lập tức
      if (pointsUsed > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { loyaltyPoints: { decrement: pointsUsed } },
        });
        await prisma.loyaltyTransaction.create({
          data: {
            userId: user.id,
            points: -pointsUsed,
            reason: `Dùng điểm cho đơn ${newOrder.id}`,
            orderId: newOrder.id,
          }
        });
      }

      return newOrder;
    });
  }

  async markAsPaid(orderId: string) {
    // GIỮ NGUYÊN CODE CŨ CỦA BẠN
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: { include: { recipes: true } } } } }
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.status !== 'PENDING') throw new BadRequestException('Đơn hàng không ở trạng thái chờ thanh toán');

    return this.prisma.$transaction(async (prisma) => {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });
      for (const item of order.items) {
        const multiplier = this.getSizeMultiplier(item.size);
        for (const recipe of item.product.recipes) {
          const amountToSubtract = recipe.amount * multiplier * item.qty;
          await prisma.ingredient.update({
            where: { id: recipe.ingredientId },
            data: { stock: { decrement: amountToSubtract } },
          });
        }
        await prisma.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.qty } },
        });
      }
      return updatedOrder;
    });
  }

  // API Hủy đơn (Đã cập nhật thêm hoàn điểm)
  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ 
      where: { id: orderId },
      include: { items: { include: { product: { include: { recipes: true } } } }, payments: true } 
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.status !== 'PAID') throw new BadRequestException('Chỉ có thể hủy đơn hàng khi đã thanh toán (PAID).');

    return this.prisma.$transaction(async (prisma) => {
      // 1. Hoàn kho (GIỮ NGUYÊN)
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

      // 2. Hoàn điểm (MỚI)
      const pointTrans = await prisma.loyaltyTransaction.findFirst({
        where: { orderId: order.id, points: { lt: 0 } }
      });
      if (pointTrans) {
        const refundPoints = Math.abs(pointTrans.points);
        await prisma.user.update({
          where: { id: order.userId },
          data: { loyaltyPoints: { increment: refundPoints } },
        });
        await prisma.loyaltyTransaction.create({
          data: {
            userId: order.userId,
            points: refundPoints,
            reason: `Hoàn điểm do hủy đơn ${order.id}`,
            orderId: order.id,
          }
        });
      }

      // 3. Hoàn tiền (GIỮ NGUYÊN)
      const payment = order.payments[0];
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' } 
        });
      }

      // 4. Đổi trạng thái
      return prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    });
  }

  async findMyOrders(userId: string) {
    // GIỮ NGUYÊN
    return this.prisma.order.findMany({
      where: { userId: userId },
      include: { items: { include: { toppings: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}