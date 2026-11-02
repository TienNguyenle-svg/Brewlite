import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CartItemDto } from '../../discounts/dto/cart-item.dto';

export class CheckoutPreviewDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiProperty({
    example: 'WELCOME10',
    description: 'Mã giảm giá (không bắt buộc)',
    required: false,
  })
  @IsOptional()
  @IsString()
  promotionCode?: string;

  @ApiProperty({
    example: true,
    description: 'Khách có chọn dùng điểm thưởng hay không',
  })
  @IsBoolean()
  usePoints: boolean;
}
