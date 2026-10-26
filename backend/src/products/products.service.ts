import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(sort?: string) {
    // Mặc định sắp xếp theo giá từ thấp đến cao
    let orderBy: any = { price: 'asc' };

    if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } 
    else if (sort === 'best_seller') {
      orderBy = { name: 'asc' }; 
    }

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