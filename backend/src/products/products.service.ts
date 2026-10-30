import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(sort?: string) {
    // Mặc định ban đầu: Bán chạy (best_seller)
    let orderBy: any = { name: 'asc' }; // Tạm thời sắp xếp theo tên để giả lập bán chạy (vì chưa có cột sold_count)

    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };  // Giá thấp đến cao
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' }; // Giá cao đến thấp
    } 
    // Nếu sort === 'best_seller' hoặc không truyền gì, sẽ dùng mặc định (orderBy ở trên)

    return this.prisma.product.findMany({
      orderBy,
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ 
      where: { id },
      include: { toppings: true },
    });
    
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    
    return product;
  }
}