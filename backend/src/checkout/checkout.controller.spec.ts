import { ForbiddenException } from '@nestjs/common';
import { DiscountsService } from '../discounts/discounts.service';
import { CheckoutController } from './checkout.controller';

describe('CheckoutController', () => {
  const discounts = { previewCheckout: jest.fn() };
  let controller: CheckoutController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new CheckoutController(
      discounts as unknown as DiscountsService,
    );
  });

  it('xem trước tổng checkout bằng một request', async () => {
    const items = [{ productId: 'product-1', size: 'M', qty: 1 }];
    const preview = { subtotal: 100000, total: 85000 };
    discounts.previewCheckout.mockResolvedValue(preview);

    await expect(
      controller.preview(
        {
          items,
          promotionCode: 'WELCOME10',
          usePoints: true,
        },
        { user: { id: 'user-1', role: 'CUSTOMER' } } as never,
      ),
    ).resolves.toEqual(preview);

    expect(discounts.previewCheckout).toHaveBeenCalledWith(
      'user-1',
      items,
      'WELCOME10',
      true,
    );
  });

  it('chặn người dùng không phải CUSTOMER', () => {
    expect(() =>
      controller.preview(
        {
          items: [{ productId: 'product-1', size: 'M', qty: 1 }],
          usePoints: false,
        },
        { user: { id: 'admin-1', role: 'ADMIN' } } as never,
      ),
    ).toThrow(ForbiddenException);
    expect(discounts.previewCheckout).not.toHaveBeenCalled();
  });
});
