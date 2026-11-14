import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ===== QUẢN LÝ SẢN PHẨM =====
  async createProduct(data: { name: string; price: number; imageUrl?: string; recipes?: { ingredientId: string; amount: number }[] }) {
    const { recipes, ...productData } = data;

    // 1. Kiểm tra trùng tên sản phẩm (không phân biệt hoa thường)
    const existingProduct = await this.prisma.product.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existingProduct) {
      throw new BadRequestException(`Sản phẩm "${data.name}" đã tồn tại. Vui lòng chọn tên khác.`);
    }

    const newProduct = await this.prisma.product.create({ data: productData });

    if (recipes && recipes.length > 0) {
      await this.prisma.recipe.createMany({
        data: recipes.map((r) => ({
          productId: newProduct.id,
          ingredientId: r.ingredientId,
          amount: r.amount,
        })),
      });
    }

    return this.prisma.product.findUnique({
      where: { id: newProduct.id },
      include: {
        recipes: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                stock: true,
                reservedQuantity: true,
                unit: true,
              },
            },
          },
        },
      },
    });
  }

  async updateProduct(id: string, data: { name?: string; price?: number; imageUrl?: string }) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return this.prisma.product.update({ where: { id }, data });
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return this.prisma.product.delete({ where: { id } });
  }

  // ===== QUẢN LÝ KHO =====
  // 1. Tạo mới nguyên liệu
  async createIngredient(data: { name: string; stock: number; unit: string }) {
    // Kiểm tra trùng tên nguyên liệu
    const existingIngredient = await this.prisma.ingredient.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existingIngredient) {
      throw new BadRequestException(`Nguyên liệu "${data.name}" đã tồn tại. Vui lòng chọn tên khác.`);
    }

    return this.prisma.ingredient.create({
      data,
      select: {
        id: true,
        name: true,
        stock: true,
        reservedQuantity: true,
        unit: true,
      },
    });
  }

  // 2. Tạo mới topping
  async createTopping(data: { name: string; price: number; stock: number }) {
    // Kiểm tra trùng tên topping
    const existingTopping = await this.prisma.topping.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existingTopping) {
      throw new BadRequestException(`Topping "${data.name}" đã tồn tại. Vui lòng chọn tên khác.`);
    }

    return this.prisma.topping.create({
      data,
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        reservedQuantity: true,
        productId: true,
      },
    });
  }

  // 3. Nhập thêm số lượng vào nguyên liệu đã có
  async importIngredient(ingredientId: string, amount: number) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id: ingredientId } });
    if (!ingredient) throw new NotFoundException('Không tìm thấy nguyên liệu');
    return this.prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        stock: { increment: amount },
        version: { increment: 1 },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        reservedQuantity: true,
        unit: true,
      },
    });
  }

  // 4. Nhập thêm số lượng vào topping đã có
  async importTopping(toppingId: string, amount: number) {
    const topping = await this.prisma.topping.findUnique({ where: { id: toppingId } });
    if (!topping) throw new NotFoundException('Không tìm thấy topping');
    return this.prisma.topping.update({
      where: { id: toppingId },
      data: {
        stock: { increment: amount },
        version: { increment: 1 },
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        reservedQuantity: true,
        productId: true,
      },
    });
  }

  // 5. Xem toàn bộ tồn kho
  async getInventory() {
    const ingredients = await this.prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        stock: true,
        reservedQuantity: true,
        unit: true,
      },
    });
    const toppings = await this.prisma.topping.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        reservedQuantity: true,
        productId: true,
      },
    });
    return { ingredients, toppings };
  }

// ===== BÁO CÁO DOANH THU =====
  async getRevenueReport() {
    // 1. Lấy thống kê cho các đơn COMPLETED
    const completedStats = await this.prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: {
        total: true,      // Doanh thu thực tế (đã trừ mã giảm, điểm thưởng)
        subtotal: true,   // Doanh thu gốc (trước khi trừ giảm giá)
      },
      _count: {
        id: true,         // Tổng số đơn COMPLETED
      },
    });

    // 2. Lấy thống kê tổng đơn CANCELLED
    const totalCancelledOrders = await this.prisma.order.count({
      where: { status: 'CANCELLED' },
    });

    return {
      totalOrders: completedStats._count.id || 0,
      totalRevenue: completedStats._sum.total || 0,
      originalRevenue: completedStats._sum.subtotal || 0, // Thống kê: Doanh thu gốc
      totalCancelledOrders,                               // Thống kê: Tổng đơn bị hủy
    };
  }
}