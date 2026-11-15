CREATE TABLE "OrderIdempotency" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  CONSTRAINT "OrderIdempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderIdempotency_orderId_key"
ON "OrderIdempotency"("orderId");

CREATE UNIQUE INDEX "OrderIdempotency_userId_idempotencyKey_key"
ON "OrderIdempotency"("userId", "idempotencyKey");

ALTER TABLE "OrderIdempotency"
ADD CONSTRAINT "OrderIdempotency_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Ingredient"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Topping"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
