import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BaristaService } from './barista.service';
import { UpdateBaristaOrderStatusDto } from './dto/update-barista-order-status.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

@ApiTags('Barista')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('barista')
export class BaristaController {
  constructor(
    private readonly baristaService: BaristaService,
  ) {}

  private ensureBarista(req: AuthenticatedRequest) {
    if (req.user?.role !== 'BARISTA') {
      throw new ForbiddenException(
        'Bạn không có quyền sử dụng chức năng Barista',
      );
    }
  }

  @Get('orders')
  @ApiOperation({
    summary: 'Lấy danh sách đơn hàng đang chờ pha chế',
  })
  findOrders(@Req() req: AuthenticatedRequest) {
    this.ensureBarista(req);
    return this.baristaService.findOrders();
  }

  @Patch('orders/:id')
  @ApiOperation({
    summary: 'Cập nhật trạng thái đơn hàng pha chế',
  })
  updateOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBaristaOrderStatusDto,
  ) {
    this.ensureBarista(req);

    return this.baristaService.updateOrderStatus(
      id,
      dto.status,
    );
  }
}