import { DiscountsService } from '../discounts/discounts.service';
import { LoyaltyController } from './loyalty.controller';

describe('LoyaltyController', () => {
  const discounts = { getLoyalty: jest.fn() };
  let controller: LoyaltyController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new LoyaltyController(
      discounts as unknown as DiscountsService,
    );
  });

  it('xem điểm thưởng của chính mình', async () => {
    discounts.getLoyalty.mockResolvedValue({ points: 100 });

    const result = await controller.getLoyalty({
      user: { id: 'user-1', role: 'CUSTOMER' },
    } as never);

    expect(discounts.getLoyalty).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ points: 100 });
  });
});
