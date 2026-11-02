-- 1. Thêm 3 trường giảm giá & điểm vào bảng Order (nếu chưa có)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pointsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pointsDiscount" INTEGER NOT NULL DEFAULT 0;

-- 2. Thêm 2 trường thời gian vào bảng Payment (nếu chưa có)
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMP(3);

-- 3. Tạo 2 index mới cho bảng Payment (nếu chưa có)
CREATE INDEX IF NOT EXISTS "Payment_status_expiresAt_idx" ON "Payment"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "Payment_orderId_status_idx" ON "Payment"("orderId", "status");