import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { getUserId } from '../discounts/customer-request';
import type { AuthenticatedRequest } from '../discounts/customer-request';
import { DiscountsService } from '../discounts/discounts.service';
import { CheckoutPreviewDto } from './dto/checkout-preview.dto';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly discounts: DiscountsService) {}

  @Post('preview')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Xem trước tổng tiền theo giỏ hàng, voucher, điểm và phí ship',
  })
  preview(@Body() dto: CheckoutPreviewDto, @Req() req: AuthenticatedRequest) {
    return this.discounts.previewCheckout(
      getUserId(req),
      dto.items,
      dto.promotionCode,
      dto.usePoints,
    );
  }
}
