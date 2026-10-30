import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaristaController } from './barista.controller';
import { BaristaService } from './barista.service';
import { BaristaOrderStatus } from './dto/update-barista-order-status.dto';

describe('BaristaController', () => {
  let controller: BaristaController;

  const baristaServiceMock = {
    findOrders: jest.fn(),
    updateOrderStatus: jest.fn(),
  };

  const baristaRequest = {
    user: {
      id: 'barista-1',
      email: 'barista@brewlite.com',
      role: 'BARISTA',
    },
  } as any;

  const customerRequest = {
    user: {
      id: 'customer-1',
      email: 'customer@brewlite.com',
      role: 'CUSTOMER',
    },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BaristaController],
      providers: [
        {
          provide: BaristaService,
          useValue: baristaServiceMock,
        },
      ],
    }).compile();

    controller = module.get<BaristaController>(BaristaController);
  });

  describe('findOrders', () => {
    it('cho phép BARISTA lấy danh sách đơn hàng', async () => {
      const orders = [{ id: 'order-1', status: 'PAID' }];
      baristaServiceMock.findOrders.mockResolvedValue(orders);

      await expect(
        controller.findOrders(baristaRequest),
      ).resolves.toEqual(orders);

      expect(baristaServiceMock.findOrders).toHaveBeenCalledTimes(1);
    });

    it('từ chối CUSTOMER', () => {
      expect(() =>
        controller.findOrders(customerRequest),
      ).toThrow(ForbiddenException);

      expect(baristaServiceMock.findOrders).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderStatus', () => {
    it('cho phép BARISTA cập nhật trạng thái đơn hàng', async () => {
      const updatedOrder = {
        id: 'order-1',
        status: 'PREPARING',
      };

      baristaServiceMock.updateOrderStatus.mockResolvedValue(
        updatedOrder,
      );

      await expect(
        controller.updateOrderStatus(
          baristaRequest,
          'order-1',
          { status: BaristaOrderStatus.PREPARING },
        ),
      ).resolves.toEqual(updatedOrder);

      expect(
        baristaServiceMock.updateOrderStatus,
      ).toHaveBeenCalledWith(
        'order-1',
        BaristaOrderStatus.PREPARING,
      );
    });

    it('từ chối CUSTOMER cập nhật trạng thái', () => {
      expect(() =>
        controller.updateOrderStatus(
          customerRequest,
          'order-1',
          { status: BaristaOrderStatus.PREPARING },
        ),
      ).toThrow(ForbiddenException);

      expect(
        baristaServiceMock.updateOrderStatus,
      ).not.toHaveBeenCalled();
    });
  });
});