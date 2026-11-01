import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BaristaController } from './barista.controller';
import { BaristaService } from './barista.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [BaristaController],
  providers: [BaristaService],
})
export class BaristaModule {}