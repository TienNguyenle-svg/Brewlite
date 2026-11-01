import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum BaristaOrderStatus {
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
}

export class UpdateBaristaOrderStatusDto {
  @ApiProperty({
    enum: BaristaOrderStatus,
    example: BaristaOrderStatus.PREPARING,
    description: 'Trạng thái tiếp theo của đơn hàng',
  })
  @IsEnum(BaristaOrderStatus)
  status: BaristaOrderStatus;
}