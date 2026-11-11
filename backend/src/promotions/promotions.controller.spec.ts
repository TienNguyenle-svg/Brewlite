import {
  ExecutionContext,
  ForbiddenException,
  RequestMethod,
} from '@nestjs/common';
import { AdminGuard } from '../admin/admin.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

describe('PromotionsController', () => {
  let controller: PromotionsController;

  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new PromotionsController(
      service as unknown as PromotionsService,
    );
  });

  describe('chuyển request sang service', () => {
    it('POST /promotions => service.create', async () => {
      const dto: CreatePromotionDto = {
        code: 'WE10',
        type: 'PERCENT',
        discount: 10,
      };
      service.create.mockResolvedValue({ id: 'promo-1' });

      await expect(controller.create(dto)).resolves.toEqual({ id: 'promo-1' });
      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('GET /promotions => service.findAll(page, limit)', async () => {
      service.findAll.mockResolvedValue({ items: [], total: 0 });

      await controller.findAll(2, 10);

      expect(service.findAll).toHaveBeenCalledWith(2, 10);
    });

    it('PATCH /promotions/:id => service.update', async () => {
      const dto: UpdatePromotionDto = { discount: 20 };
      service.update.mockResolvedValue({ id: 'promo-1' });

      await controller.update('promo-1', dto);

      expect(service.update).toHaveBeenCalledWith('promo-1', dto);
    });

    it('DELETE /promotions/:id => service.remove (xóa mềm)', async () => {
      service.remove.mockResolvedValue({ id: 'promo-1', active: false });

      await controller.remove('promo-1');

      expect(service.remove).toHaveBeenCalledWith('promo-1');
    });
  });

  describe('khai báo route', () => {
    const path = (target: object) => Reflect.getMetadata('path', target);
    const method = (target: object) => Reflect.getMetadata('method', target);
    const proto = PromotionsController.prototype;

    it('prefix là /promotions', () => {
      expect(path(PromotionsController)).toBe('promotions');
    });

    it('đúng HTTP method và đường dẫn của 4 API', () => {
      expect(method(proto.create)).toBe(RequestMethod.POST);
      expect(path(proto.create)).toBe('/');

      expect(method(proto.findAll)).toBe(RequestMethod.GET);
      expect(path(proto.findAll)).toBe('/');

      expect(method(proto.update)).toBe(RequestMethod.PATCH);
      expect(path(proto.update)).toBe(':id');

      expect(method(proto.remove)).toBe(RequestMethod.DELETE);
      expect(path(proto.remove)).toBe(':id');
    });
  });

  describe('phân quyền ADMIN', () => {
    it('controller dùng JwtAuthGuard rồi AdminGuard', () => {
      const guards = Reflect.getMetadata('__guards__', PromotionsController);

      expect(guards).toEqual([JwtAuthGuard, AdminGuard]);
    });

    const contextOf = (user: unknown) =>
      ({
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
      }) as unknown as ExecutionContext;

    it('ADMIN được qua', () => {
      expect(new AdminGuard().canActivate(contextOf({ role: 'ADMIN' }))).toBe(
        true,
      );
    });

    it('CUSTOMER, BARISTA hoặc chưa đăng nhập => 403', () => {
      const guard = new AdminGuard();

      expect(() => guard.canActivate(contextOf({ role: 'CUSTOMER' }))).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(contextOf({ role: 'BARISTA' }))).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(contextOf(undefined))).toThrow(
        ForbiddenException,
      );
    });
  });
});