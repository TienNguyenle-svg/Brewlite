import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  const ordersService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the Idempotency-Key header to the order service', async () => {
    const dto = {
      items: [],
      receiverName: 'Customer',
      receiverPhone: '0900000000',
      deliveryAddress: 'Address',
    };
    ordersService.create.mockResolvedValue({ id: 'order-1' });

    await expect(
      controller.create(
        dto as never,
        { user: { id: 'user-1', role: 'CUSTOMER' } },
        'ORD-123',
      ),
    ).resolves.toEqual({ id: 'order-1' });

    expect(ordersService.create).toHaveBeenCalledWith(
      dto,
      'user-1',
      'ORD-123',
    );
  });
});
