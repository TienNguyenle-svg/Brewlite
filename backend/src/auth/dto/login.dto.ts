import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'customer@brewlite.com',
    description: 'Email tài khoản',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'a123456',
    description: 'Mật khẩu tài khoản',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;
}