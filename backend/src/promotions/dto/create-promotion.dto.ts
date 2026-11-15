import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreatePromotionDto {
  @ApiProperty({ example: 'WE10', description: 'Tự động chuyển thành chữ HOA' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,30}$/, {
    message: 'Mã chỉ gồm chữ, số, "-" hoặc "_", dài 3-30 ký tự',
  })
  code: string;

  @ApiProperty({ example: 'PERCENT', enum: ['PERCENT', 'FIXED'] })
  @IsIn(['PERCENT', 'FIXED'])
  type: 'PERCENT' | 'FIXED';

  @ApiProperty({
    example: 10,
    description: 'PERCENT: 1-100 (%); FIXED: số tiền giảm (đồng)',
  })
  @IsInt()
  @Min(1)
  discount: number;

  @ApiPropertyOptional({ example: 50000, description: 'Giá trị đơn tối thiểu' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minOrder?: number;

  @ApiPropertyOptional({
    example: '2026-11-10T00:00:00.000Z',
    description: 'Ngày bắt đầu, bỏ trống = có hiệu lực ngay',
  })
  @IsOptional()
  @IsDateString()
  startAt?: string | null;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Ngày kết thúc, bỏ trống = không hết hạn',
  })
  @IsOptional()
  @IsDateString()
  expiredAt?: string | null;

  @ApiPropertyOptional({
    example: 100,
    description: 'Tổng số lượt dùng toàn hệ thống, bỏ trống = không giới hạn',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number | null;
}