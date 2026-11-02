import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DiscountsService } from './discounts.service';

@Module({
  imports: [PrismaModule],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}