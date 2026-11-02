import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CartItemDto {
  @ApiProperty({ example: '00fd01c9-01ce-4554-b761-30e52badeaa8' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'M', enum: ['S', 'M', 'L'] })
  @IsIn(['S', 'M', 'L'])
  size: 'S' | 'M' | 'L';

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({ example: [], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toppingIds?: string[];
}
