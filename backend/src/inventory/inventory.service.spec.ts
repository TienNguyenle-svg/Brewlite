import { ConflictException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;

  const tx = {
    order: { findUnique: jest.fn() },
    ingredient: { findUnique: jest.fn() },
    topping: { findUnique: jest.fn() },
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
    tx.ingredient.findUnique.mockResolvedValue({
      version: 0,
      stock: 100,
      reservedQuantity: 0,
    });
    tx.topping.findUnique.mockResolvedValue({
      version: 0,
      stock: 100,
      reservedQuantity: 0,
    });
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

  it('rejects a concurrent reservation when the winning reservation uses the remaining stock', async () => {
    tx.ingredient.findUnique
      .mockResolvedValueOnce({
        version: 0,
        stock: 24,
        reservedQuantity: 0,
      })
      .mockResolvedValueOnce({
        version: 0,
        stock: 24,
        reservedQuantity: 0,
      })
      .mockResolvedValueOnce({
        version: 1,
        stock: 24,
        reservedQuantity: 24,
      });

    let ingredientUpdates = 0;
    tx.$executeRaw.mockImplementation(async (query: TemplateStringsArray) => {
      if (query.join('').includes('UPDATE "Ingredient"')) {
        ingredientUpdates += 1;
        return ingredientUpdates === 1 ? 1 : 0;
      }

      return 1;
    });

    const results = await Promise.allSettled([
      service.reserveOrder(tx as never, 'order-1'),
      service.reserveOrder(tx as never, 'order-2'),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    if (rejected[0].status === 'rejected') {
      expect(rejected[0].reason).toBeInstanceOf(ConflictException);
    }
    expect(tx.$executeRaw.mock.calls[0][0].join('')).toContain(
      '"version" = "version" + 1',
    );
    expect(tx.$executeRaw.mock.calls[0][0].join('')).toContain(
      'AND "version" = ',
    );
  });

  it('retries a stale inventory version when enough stock remains', async () => {
    tx.ingredient.findUnique
      .mockResolvedValueOnce({
        version: 0,
        stock: 48,
        reservedQuantity: 0,
      })
      .mockResolvedValueOnce({
        version: 0,
        stock: 48,
        reservedQuantity: 0,
      })
      .mockResolvedValueOnce({
        version: 1,
        stock: 48,
        reservedQuantity: 24,
      });

    let ingredientUpdates = 0;
    tx.$executeRaw.mockImplementation(async (query: TemplateStringsArray) => {
      if (query.join('').includes('UPDATE "Ingredient"')) {
        ingredientUpdates += 1;
        return ingredientUpdates === 2 ? 0 : 1;
      }

      return 1;
    });

    const results = await Promise.all([
      service.reserveOrder(tx as never, 'order-1'),
      service.reserveOrder(tx as never, 'order-2'),
    ]);

    expect(results).toHaveLength(2);
    expect(ingredientUpdates).toBe(3);
  });

  it('rejects a reservation when an ingredient has insufficient available stock', async () => {
    tx.ingredient.findUnique.mockResolvedValueOnce({
      version: 0,
      stock: 23,
      reservedQuantity: 0,
    });

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
