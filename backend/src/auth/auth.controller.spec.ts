
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call register with the provided data', async () => {
      const dto = {
        email: 'tester@example.com',
        password: 'TestPassword123',
      };

      const expectedResult = {
        message: 'Đăng ký thành công',
      };

      authServiceMock.register.mockResolvedValue(expectedResult);

      await expect(controller.register(dto)).resolves.toEqual(
        expectedResult,
      );

      expect(authServiceMock.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call login with the provided data', async () => {
      const dto = {
        email: 'tester@example.com',
        password: 'TestPassword123',
      };

      const expectedResult = {
        message: 'Đăng nhập thành công',
        accessToken: 'test-access-token',
        tokenType: 'Bearer',
        user: {
          id: 'user-1',
          email: 'tester@example.com',
          role: 'CUSTOMER',
          loyaltyPoints: 0,
        },
      };

      authServiceMock.login.mockResolvedValue(expectedResult);

      await expect(controller.login(dto)).resolves.toEqual(
        expectedResult,
      );

      expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('logout', () => {
    it('should call logout with the authenticated user ID', async () => {
      const req = {
        user: {
          id: 'user-1',
          email: 'tester@example.com',
          role: 'CUSTOMER',
        },
      };

      const expectedResult = {
        message: 'Đăng xuất thành công',
      };

      authServiceMock.logout.mockResolvedValue(expectedResult);

      await expect(controller.logout(req as any)).resolves.toEqual(
        expectedResult,
      );

      expect(authServiceMock.logout).toHaveBeenCalledWith('user-1');
    });

    it('should reject when the user ID is missing', async () => {
      const req = {
        user: {
          email: 'tester@example.com',
          role: 'CUSTOMER',
        },
      };

      await expect(
        controller.logout(req as any),
      ).rejects.toThrow(UnauthorizedException);

      expect(authServiceMock.logout).not.toHaveBeenCalled();
    });
  });
});
