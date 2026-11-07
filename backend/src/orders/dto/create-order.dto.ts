import { IsArray, IsString, IsInt, Min, ValidateNested, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 'b0141c3f-6431-4ddc-8288-9aa3873bb339' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  size: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({ example: ['topping-id-1'], required: false })
  @IsArray()
  @IsString({ each: true })
  toppingIds?: string[];
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  receiverName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  receiverPhone: string;

  @ApiProperty({ example: '123 Nguyen Trai, Quan 1' })
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  deliveryAddress: string;

  @ApiProperty({ example: 'WELCOME10', required: false })
  @IsOptional()
  @IsString()
  promotionCode?: string;
}