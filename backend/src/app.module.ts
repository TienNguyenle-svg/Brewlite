import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module'; 
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';
import { BaristaModule } from './barista/barista.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ProductsModule,
    OrdersModule, 
    AuthModule,
    PaymentsModule,
    BaristaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}