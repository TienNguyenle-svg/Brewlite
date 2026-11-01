
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtMock = {
    signAsync: jest.fn(),
  };

  const user = {
    id: 'user-1',
    email: 'tester@example.com',
    passwordHash: 'hashed-password',
    role: 'CUSTOMER',
    loyaltyPoints: 0,
    tokenVersion: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: jwtMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a customer successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      prismaMock.user.create.mockResolvedValue({
        id: user.id,
        email: user.email,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
      });

      const result = await service.register({
        email: ' Tester@Example.com ',
        password: 'TestPassword123',
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'tester@example.com' },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'TestPassword123',
        10,
      );

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'tester@example.com',
          passwordHash: 'hashed-password',
          role: 'CUSTOMER',
        },
        select: {
          id: true,
          email: true,
          role: true,
          loyaltyPoints: true,
        },
      });

      expect(result.user.email).toBe('tester@example.com');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should reject an existing email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);

      await expect(
        service.register({
          email: user.email,
          password: 'TestPassword123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return an access token for valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.signAsync.mockResolvedValue('test-access-token');

      const result = await service.login({
        email: user.email,
        password: 'TestPassword123',
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: user.email },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'TestPassword123',
        user.passwordHash,
      );

      expect(jwtMock.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
      });

      expect(result.accessToken).toBe('test-access-token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should reject an unknown email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'TestPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });

    it('should reject an incorrect password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: user.email,
          password: 'WrongPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should increment tokenVersion when logging out', async () => {
      prismaMock.user.update.mockResolvedValue({
        ...user,
        tokenVersion: 1,
      });

      const result = await service.logout(user.id);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          tokenVersion: { increment: 1 },
        },
      });

      expect(result).toEqual({
        message: 'Đăng xuất thành công',
      });
    });
  });
});
