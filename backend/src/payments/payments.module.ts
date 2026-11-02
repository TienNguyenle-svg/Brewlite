import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscountsModule } from '../discounts/discounts.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentExpiryService } from './payment-expiry.service';

@Module({
  imports: [ConfigModule, PrismaModule, DiscountsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentExpiryService],
  exports: [PaymentsService],
})
export class PaymentsModule {}