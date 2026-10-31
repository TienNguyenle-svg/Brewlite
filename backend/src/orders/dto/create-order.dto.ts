import { IsArray, IsString, IsInt, Min, ValidateNested, IsOptional } from 'class-validator';
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

  @ApiProperty({ example: ['topping-id-1', 'topping-id-2'], required: false })
  @IsOptional()
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
}