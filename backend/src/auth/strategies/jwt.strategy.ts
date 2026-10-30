
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET chưa được cấu hình');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    tokenVersion: number;
  }) {
    if (
      !payload.sub ||
      !payload.email ||
      !payload.role ||
      typeof payload.tokenVersion !== 'number'
    ) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        tokenVersion: true,
      },
    });

    if (
      !user ||
      user.email !== payload.email ||
      user.role !== payload.role ||
      user.tokenVersion !== payload.tokenVersion
    ) {
      throw new UnauthorizedException(
        'Token không hợp lệ hoặc đã đăng xuất',
      );
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
