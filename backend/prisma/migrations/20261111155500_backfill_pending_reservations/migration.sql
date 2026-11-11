-- Reconcile resources held by all orders that are still PENDING.
UPDATE "Ingredient" AS ingredient
SET "reservedQuantity" = COALESCE((
  SELECT SUM(
    recipe."amount" *
    CASE order_item."size"
      WHEN 'S' THEN 0.8
      WHEN 'L' THEN 1.2
      ELSE 1.0
    END *
    order_item."qty"
  )
  FROM "OrderItem" AS order_item
  JOIN "Order" AS customer_order
    ON customer_order."id" = order_item."orderId"
  JOIN "Recipe" AS recipe
    ON recipe."productId" = order_item."productId"
  WHERE customer_order."status" = 'PENDING'
    AND recipe."ingredientId" = ingredient."id"
), 0);

UPDATE "Topping" AS topping
SET "reservedQuantity" = COALESCE((
  SELECT COALESCE(SUM(order_item."qty"), 0)::INTEGER
  FROM "OrderItemTopping" AS item_topping
  JOIN "OrderItem" AS order_item
    ON order_item."id" = item_topping."orderItemId"
  JOIN "Order" AS customer_order
    ON customer_order."id" = order_item."orderId"
  WHERE customer_order."status" = 'PENDING'
    AND item_topping."toppingId" = topping."id"
), 0);

UPDATE "User" AS customer
SET "reservedPoints" = COALESCE((
  SELECT COALESCE(SUM(customer_order."pointsUsed"), 0)::INTEGER
  FROM "Order" AS customer_order
  WHERE customer_order."userId" = customer."id"
    AND customer_order."status" = 'PENDING'
), 0);
