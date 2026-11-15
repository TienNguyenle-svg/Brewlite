import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type InventoryTransaction = Prisma.TransactionClient;

const MAX_RESERVATION_ATTEMPTS = 3;

@Injectable()
export class InventoryService {
  async reserveOrder(tx: InventoryTransaction, orderId: string): Promise<void> {
    const quantities = await this.getOrderQuantities(tx, orderId);
    if (!quantities) return;

    for (const [ingredientId, required] of quantities.ingredients) {
      if (required <= 0) continue;

      let reserved = false;
      for (let attempt = 0; attempt < MAX_RESERVATION_ATTEMPTS; attempt += 1) {
        const ingredient = await tx.ingredient.findUnique({
          where: { id: ingredientId },
          select: { version: true, stock: true, reservedQuantity: true },
        });
        if (
          !ingredient ||
          ingredient.stock - ingredient.reservedQuantity < required
        ) {
          throw new ConflictException('Hết nguyên liệu khi giữ chỗ đơn hàng');
        }

        const updated = await tx.$executeRaw`
          UPDATE "Ingredient"
          SET "reservedQuantity" = "reservedQuantity" + ${required},
              "version" = "version" + 1
          WHERE "id" = ${ingredientId}
            AND "version" = ${ingredient.version}
            AND "stock" - "reservedQuantity" >= ${required}
        `;

        if (updated > 0) {
          reserved = true;
          break;
        }
      }

      if (!reserved) {
        throw new ConflictException(
          'Tồn kho nguyên liệu đang thay đổi. Vui lòng thử lại',
        );
      }
    }

    for (const [toppingId, required] of quantities.toppings) {
      if (required <= 0) continue;

      let reserved = false;
      for (let attempt = 0; attempt < MAX_RESERVATION_ATTEMPTS; attempt += 1) {
        const topping = await tx.topping.findUnique({
          where: { id: toppingId },
          select: { version: true, stock: true, reservedQuantity: true },
        });
        if (
          !topping ||
          topping.stock - topping.reservedQuantity < required
        ) {
          throw new ConflictException('Hết topping khi giữ chỗ đơn hàng');
        }

        const updated = await tx.$executeRaw`
          UPDATE "Topping"
          SET "reservedQuantity" = "reservedQuantity" + ${required},
              "version" = "version" + 1
          WHERE "id" = ${toppingId}
            AND "version" = ${topping.version}
            AND "stock" - "reservedQuantity" >= ${required}
        `;

        if (updated > 0) {
          reserved = true;
          break;
        }
      }

      if (!reserved) {
        throw new ConflictException(
          'Tồn kho topping đang thay đổi. Vui lòng thử lại',
        );
      }
    }
  }

  async releaseOrder(tx: InventoryTransaction, orderId: string): Promise<void> {
    const quantities = await this.getOrderQuantities(tx, orderId);
    if (!quantities) return;

    for (const [ingredientId, required] of quantities.ingredients) {
      if (required <= 0) continue;
      await tx.$executeRaw`
        UPDATE "Ingredient"
        SET "reservedQuantity" = GREATEST("reservedQuantity" - ${required}, 0),
            "version" = "version" + 1
        WHERE "id" = ${ingredientId}
      `;
    }

    for (const [toppingId, required] of quantities.toppings) {
      if (required <= 0) continue;
      await tx.$executeRaw`
        UPDATE "Topping"
        SET "reservedQuantity" = GREATEST("reservedQuantity" - ${required}, 0),
            "version" = "version" + 1
        WHERE "id" = ${toppingId}
      `;
    }
  }

  async settleOrder(
    tx: InventoryTransaction,
    orderId: string,
    allowInsufficientStock = false,
  ): Promise<void> {
    const quantities = await this.getOrderQuantities(tx, orderId);
    if (!quantities) return;

    for (const [ingredientId, required] of quantities.ingredients) {
      if (required <= 0) continue;

      const updated = allowInsufficientStock
        ? await tx.$executeRaw`
            UPDATE "Ingredient"
              SET "stock" = "stock" - ${required},
                  "version" = "version" + 1
              WHERE "id" = ${ingredientId}
            `
        : await tx.$executeRaw`
            UPDATE "Ingredient"
            SET "stock" = "stock" - ${required},
              "reservedQuantity" = GREATEST("reservedQuantity" - ${required}, 0),
              "version" = "version" + 1
            WHERE "id" = ${ingredientId}
              AND "stock" >= ${required}
          `;

      if (updated === 0) {
        throw new ConflictException('Hết nguyên liệu khi xác nhận thanh toán');
      }
    }

    for (const [toppingId, required] of quantities.toppings) {
      if (required <= 0) continue;

      const updated = allowInsufficientStock
        ? await tx.$executeRaw`
            UPDATE "Topping"
              SET "stock" = "stock" - ${required},
                  "version" = "version" + 1
              WHERE "id" = ${toppingId}
            `
        : await tx.$executeRaw`
            UPDATE "Topping"
            SET "stock" = "stock" - ${required},
              "reservedQuantity" = GREATEST("reservedQuantity" - ${required}, 0),
              "version" = "version" + 1
            WHERE "id" = ${toppingId}
              AND "stock" >= ${required}
          `;

      if (updated === 0) {
        throw new ConflictException('Hết topping khi xác nhận thanh toán');
      }
    }
  }

  async refundOrder(tx: InventoryTransaction, orderId: string): Promise<void> {
    const quantities = await this.getOrderQuantities(tx, orderId);
    if (!quantities) return;

    for (const [ingredientId, required] of quantities.ingredients) {
      if (required <= 0) continue;
      await tx.$executeRaw`
        UPDATE "Ingredient"
        SET "stock" = "stock" + ${required},
            "version" = "version" + 1
        WHERE "id" = ${ingredientId}
      `;
    }

    for (const [toppingId, required] of quantities.toppings) {
      if (required <= 0) continue;
      await tx.$executeRaw`
        UPDATE "Topping"
        SET "stock" = "stock" + ${required},
            "version" = "version" + 1
        WHERE "id" = ${toppingId}
      `;
    }
  }

  private async getOrderQuantities(
    tx: InventoryTransaction,
    orderId: string,
  ): Promise<{
    ingredients: Map<string, number>;
    toppings: Map<string, number>;
  } | null> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                recipes: {
                  select: { ingredientId: true, amount: true },
                },
              },
            },
            toppings: { select: { toppingId: true } },
          },
        },
      },
    });

    if (!order) return null;

    const ingredients = new Map<string, number>();
    const toppings = new Map<string, number>();

    for (const item of order.items) {
      const multiplier = this.getSizeMultiplier(item.size);
      for (const recipe of item.product.recipes) {
        ingredients.set(
          recipe.ingredientId,
          (ingredients.get(recipe.ingredientId) ?? 0) +
            recipe.amount * multiplier * item.qty,
        );
      }

      for (const topping of item.toppings) {
        toppings.set(
          topping.toppingId,
          (toppings.get(topping.toppingId) ?? 0) + item.qty,
        );
      }
    }

    return {
      ingredients: new Map(
        [...ingredients].sort(([a], [b]) => a.localeCompare(b)),
      ),
      toppings: new Map([...toppings].sort(([a], [b]) => a.localeCompare(b))),
    };
  }

  private getSizeMultiplier(size: string): number {
    if (size === 'S') return 0.8;
    if (size === 'L') return 1.2;
    return 1;
  }
}
