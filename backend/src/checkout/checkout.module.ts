import { Module } from '@nestjs/common';
import { DiscountsModule } from '../discounts/discounts.module';
import { CheckoutController } from './checkout.controller';

@Module({
  imports: [DiscountsModule],
  controllers: [CheckoutController],
})
export class CheckoutModule {}
