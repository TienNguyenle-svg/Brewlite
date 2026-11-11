import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePromotionDto } from './create-promotion.dto';

export class UpdatePromotionDto extends PartialType(
  OmitType(CreatePromotionDto, ['code', 'type'] as const),
) {
  @ApiPropertyOptional({ example: true, description: 'false = tắt mã' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}