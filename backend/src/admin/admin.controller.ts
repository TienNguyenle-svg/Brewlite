import { 
  Controller, Post, Get, Body, Param, 
  UseGuards, ForbiddenException, 
  CanActivate, ExecutionContext, Injectable, Patch, Delete
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user && user.role === 'ADMIN') return true;
    throw new ForbiddenException('Chỉ Admin mới có quyền truy cập');
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ===== QUẢN LÝ SẢN PHẨM =====
  @Post('products')
  @ApiOperation({ summary: 'Thêm sản phẩm mới (kèm công thức)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Cà phê trứng' },
        price: { type: 'number', example: 40000 },
        imageUrl: { type: 'string', example: '/images/ca-phe-trung.jpg' },
        recipes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ingredientId: { type: 'string', example: 'ID_CỦA_NGUYÊN_LIỆU' },
              amount: { type: 'number', example: 25 },
            },
          },
        },
      },
    },
  })
  createProduct(@Body() body: { 
    name: string; 
    price: number; 
    imageUrl?: string; 
    recipes?: { ingredientId: string; amount: number }[] 
  }) {
    return this.adminService.createProduct(body);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Tên mới' },
        price: { type: 'number', example: 55000 },
        imageUrl: { type: 'string', example: '/images/anh-moi.jpg' },
      },
    },
  })
  updateProduct(
    @Param('id') id: string, 
    @Body() body: { name?: string; price?: number; imageUrl?: string }
  ) {
    return this.adminService.updateProduct(id, body);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Xóa sản phẩm' })
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  // ===== QUẢN LÝ KHO =====
  @Get('inventory')
  @ApiOperation({ summary: 'Xem toàn bộ tồn kho (Nguyên liệu và Topping)' })
  getInventory() {
    return this.adminService.getInventory();
  }

  // Thêm mới nguyên liệu (Chưa từng có trong kho)
  @Post('ingredients')
  @ApiOperation({ summary: 'Thêm nguyên liệu mới vào kho' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Trứng gà' },
        stock: { type: 'number', example: 100 },
        unit: { type: 'string', example: 'quả' },
      },
    },
  })
  createIngredient(@Body() body: { name: string; stock: number; unit: string }) {
    return this.adminService.createIngredient(body);
  }

  // Nhập thêm số lượng cho nguyên liệu đã có
  @Post('ingredients/:id/import')
  @ApiOperation({ summary: 'Nhập thêm nguyên liệu đã có vào kho' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 1000 },
      },
    },
  })
  importIngredient(@Param('id') id: string, @Body('amount') amount: number) {
    return this.adminService.importIngredient(id, amount);
  }

  // Thêm mới topping (Chưa từng có trong kho)
  @Post('toppings')
  @ApiOperation({ summary: 'Thêm topping mới vào kho' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Thạch dừa' },
        price: { type: 'number', example: 5000 },
        stock: { type: 'number', example: 100 },
      },
    },
  })
  createTopping(@Body() body: { name: string; price: number; stock: number }) {
    return this.adminService.createTopping(body);
  }

  // Nhập thêm số lượng cho topping đã có
  @Post('toppings/:id/import')
  @ApiOperation({ summary: 'Nhập thêm topping đã có vào kho' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 50 },
      },
    },
  })
  importTopping(@Param('id') id: string, @Body('amount') amount: number) {
    return this.adminService.importTopping(id, amount);
  }

  // ===== BÁO CÁO DOANH THU =====
  @Get('reports/revenue')
  @ApiOperation({ summary: 'Xem báo cáo doanh thu' })
  getRevenueReport() {
    return this.adminService.getRevenueReport();
  }
}