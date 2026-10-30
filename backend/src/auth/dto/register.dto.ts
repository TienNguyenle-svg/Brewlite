
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'customer@brewlite.com',
    description: 'Email đăng ký tài khoản mới',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'a123456',
     description: 'Mật khẩu tối thiểu 6 ký tự, phải chứa cả chữ cái và chữ số',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
  message: 'Mật khẩu phải chứa ít nhất một chữ cái và một chữ số',
})
  password: string;
}
