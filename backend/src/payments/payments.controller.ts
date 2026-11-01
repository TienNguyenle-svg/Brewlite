import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

type AuthenticatedRequest = Request & {
  user: {
    id?: string;
    userId?: string;
    sub?: string;
    role?: string;
  };
};

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tạo URL thanh toán VNPay, chỉ dành cho CUSTOMER',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Dạng PAY-<số>. Mỗi lần thử lại đổi số: PAY-1, PAY-2, PAY-3... (frontend có thể dùng PAY-<timestamp>)',
    example: 'PAY-1',
  })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getCustomerId(req);

    // Đọc header từ req (không dùng @Headers) để Swagger chỉ hiện 1 ô Idempotency-Key.
    const rawKey = req.headers['idempotency-key'];
    const idempotencyKey = typeof rawKey === 'string' ? rawKey : '';

    return this.paymentsService.createPayment(
      userId,
      dto.orderId,
      idempotencyKey,
      req.ip || '127.0.0.1',
    );
  }

  @Post('orders/:orderId/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Khách hủy đơn (sau khi thanh toán lỗi hoặc khi chưa có lượt thanh toán còn hạn)',
  })
  async cancelOrder(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getCustomerId(req);

    return this.paymentsService.cancelOrder(userId, orderId);
  }

  @Get('vnpay-return')
  @ApiOperation({
    summary: 'Xác minh kết quả thanh toán trả về từ VNPay',
  })
  async vnpayReturn(
    @Query() query: Record<string, string | string[]>,
    @Res() response: Response,
  ) {
    const result = await this.paymentsService.processVnpayReturn(query);

    const frontendUrl = (
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    ).replace(/\/+$/, '');

    const redirectUrl = new URL(`${frontendUrl}/payment/result`);
    redirectUrl.searchParams.set('status', result.status);
    redirectUrl.searchParams.set('orderId', result.orderId);

    return response.redirect(302, redirectUrl.toString());
  }

  // Chỉ CUSTOMER mới được thanh toán/hủy đơn; lấy ID người dùng từ JWT.
  private getCustomerId(req: AuthenticatedRequest): string {
    if (req.user?.role !== 'CUSTOMER') {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }

    const userId = req.user.id ?? req.user.userId ?? req.user.sub;

    if (!userId) {
      throw new BadRequestException(
        'JWT strategy chưa trả về ID người dùng hợp lệ',
      );
    }

    return userId;
  }
}