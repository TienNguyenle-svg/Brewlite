import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const config = { get: jest.fn() };

  const user = {
    id: 'user-1',
    email: 'tester@example.com',
    role: 'CUSTOMER',
    tokenVersion: 0,
  };

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  };

  function createStrategy() {
    return new JwtStrategy(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  }

  beforeEach(() => {
    jest.resetAllMocks();
    config.get.mockReturnValue('test-secret');
    strategy = createStrategy();
  });

  it('báo lỗi khi chưa cấu hình JWT_SECRET', () => {
    config.get.mockReturnValue(undefined);

    expect(() => createStrategy()).toThrow('JWT_SECRET chưa được cấu hình');
  });

  it('token hợp lệ: trả id, email, role của người dùng', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await strategy.validate(payload);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });
    expect(result).toEqual({
      id: 'user-1',
      email: 'tester@example.com',
      role: 'CUSTOMER',
    });
  });

  it.each([
    ['thiếu sub', { sub: '' }],
    ['thiếu email', { email: '' }],
    ['thiếu role', { role: '' }],
    ['tokenVersion không phải số', { tokenVersion: undefined }],
  ])('từ chối token %s, không truy vấn DB', async (_name, override) => {
    await expect(
      strategy.validate({ ...payload, ...override } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('từ chối khi người dùng không còn tồn tại', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('từ chối khi email hoặc role trong token khác DB', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...user, role: 'ADMIN' });

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    prisma.user.findUnique.mockResolvedValue({
      ...user,
      email: 'other@example.com',
    });

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('từ chối token cũ sau khi đăng xuất (tokenVersion đã tăng)', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...user, tokenVersion: 1 });

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});