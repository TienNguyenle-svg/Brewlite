import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentsService } from './payments.service';

@Injectable()
export class PaymentExpiryService {
  private readonly logger = new Logger(PaymentExpiryService.name);
  private running = false;

  constructor(private readonly paymentsService: PaymentsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredPayments(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const now = new Date();

      // 1. Lượt thanh toán quá 10 phút => FAILED, đơn => PAYMENT_FAILED/CANCELLED.
      const expired = await this.paymentsService.failExpiredPayments(now);

      // 2. Đơn PAYMENT_FAILED không thử lại trong 10 phút => CANCELLED.
      const cancelled = await this.paymentsService.cancelStaleFailedOrders(now);

      if (expired > 0 || cancelled > 0) {
        this.logger.log(
          `Đã đánh dấu ${expired} lượt thanh toán hết hạn và hủy ${cancelled} đơn vì quá 10 phút không thanh toán lại.`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Lỗi khi xử lý thanh toán hết hạn',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.running = false;
    }
  }
}