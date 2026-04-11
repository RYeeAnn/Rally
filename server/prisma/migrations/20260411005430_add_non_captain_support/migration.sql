-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "is_captain" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "personal_amount_owed" DOUBLE PRECISION,
ADD COLUMN     "personal_amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "personal_payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
