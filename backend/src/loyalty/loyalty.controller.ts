import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { getUserId } from '../discounts/customer-request';
import type { AuthenticatedRequest } from '../discounts/customer-request';
import { DiscountsService } from '../discounts/discounts.service';

@ApiTags('loyalty')
@Controller('users')
export class LoyaltyController {
  constructor(private readonly discounts: DiscountsService) {}

  @Get('me/loyalty')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xem số điểm thưởng và lịch sử điểm' })
  getLoyalty(@Req() req: AuthenticatedRequest) {
    return this.discounts.getLoyalty(getUserId(req, false));
  }
}
