import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
<<<<<<< HEAD
=======
// import { ScheduleModule } from '@nestjs/schedule';
>>>>>>> bfd372bd229d5dd3de2186c39938686cba8b8e3f
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
<<<<<<< HEAD
=======
// import { PaymentsModule } from './payments/payments.module';
>>>>>>> bfd372bd229d5dd3de2186c39938686cba8b8e3f
import { BaristaModule } from './barista/barista.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
<<<<<<< HEAD
=======
    // ScheduleModule.forRoot(),
>>>>>>> bfd372bd229d5dd3de2186c39938686cba8b8e3f
    PrismaModule,
    ProductsModule,
    OrdersModule,
    AuthModule,
<<<<<<< HEAD
=======
    // PaymentsModule,
>>>>>>> bfd372bd229d5dd3de2186c39938686cba8b8e3f
    BaristaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
