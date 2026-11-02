import { Module } from '@nestjs/common';
import { DiscountsModule } from '../discounts/discounts.module';
import { LoyaltyController } from './loyalty.controller';

@Module({
  imports: [DiscountsModule],
  controllers: [LoyaltyController],
})
export class LoyaltyModule {}