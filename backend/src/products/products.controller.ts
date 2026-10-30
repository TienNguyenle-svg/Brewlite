import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm (Mặc định: Bán chạy)' })
  @ApiQuery({ 
    name: 'sort', 
    required: false, 
    description: 'Sắp xếp: best_seller (mặc định), price_asc (thấp-cao), price_desc (cao-thấp)' 
  })
  findAll(@Query('sort') sort?: string) {
    // Nếu không truyền sort, mặc định là 'best_seller'
    return this.productsService.findAll(sort || 'best_seller');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm theo ID' })
  @ApiParam({ name: 'id', description: 'UUID của sản phẩm' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }
}