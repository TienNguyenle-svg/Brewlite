import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sắp xếp: price_asc, price_desc, best_seller' })
  findAll(@Query('sort') sort?: string) {
    return this.productsService.findAll(sort);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm theo ID' })
  @ApiParam({ name: 'id', description: 'UUID của sản phẩm' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }
}