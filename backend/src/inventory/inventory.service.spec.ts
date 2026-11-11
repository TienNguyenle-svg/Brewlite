import { ConflictException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;

  const tx = {
    order: { findUnique: jest.fn() },
    $executeRaw: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    tx.order.findUnique.mockResolvedValue({
      items: [
        {
          size: 'L',
          qty: 2,
          product: {
            recipes: [{ ingredientId: 'ingredient-1', amount: 10 }],
          },
          toppings: [{ toppingId: 'topping-1' }],
        },
      ],
    });
    tx.$executeRaw.mockResolvedValue(1);
    service = new InventoryService();
  });

  it('keeps atomic availability checks and calculates size and item quantities', async () => {
    await service.reserveOrder(tx as never, 'order-1');

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.$executeRaw.mock.calls[0][1]).toBe(24);
    expect(tx.$executeRaw.mock.calls[0][0].join('')).toContain(
      '"stock" - "reservedQuantity" >=',
    );
    expect(tx.$executeRaw.mock.calls[1][1]).toBe(2);
  });

  it('rejects a reservation when an ingredient has insufficient available stock', async () => {
    tx.$executeRaw.mockResolvedValueOnce(0);

    await expect(
      service.reserveOrder(tx as never, 'order-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('settles a late successful payment without a stock availability guard', async () => {
    await service.settleOrder(tx as never, 'order-1', true);

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.$executeRaw.mock.calls[0][0].join('')).not.toContain(
      '"stock" >=',
    );
    expect(tx.$executeRaw.mock.calls[1][0].join('')).not.toContain(
      '"stock" >=',
    );
    expect(tx.$executeRaw.mock.calls[0][0].join('')).not.toContain(
      '"reservedQuantity" = GREATEST',
    );
    expect(tx.$executeRaw.mock.calls[1][0].join('')).not.toContain(
      '"reservedQuantity" = GREATEST',
    );
  });
});
