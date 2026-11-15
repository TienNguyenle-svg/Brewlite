-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "reservedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Topping" ADD COLUMN     "reservedQuantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pointsOwed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reservedPoints" INTEGER NOT NULL DEFAULT 0;
