ALTER TABLE "Booking" ADD COLUMN "privacyAcceptedAt" TIMESTAMP(3);

ALTER TABLE "PricingRule"
ADD COLUMN "maximumNights" INTEGER,
ADD COLUMN "baseGuestCount" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "extraAdultFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "childRates" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "cleaningFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PricingRule" ALTER COLUMN "childRates" DROP DEFAULT;

ALTER TABLE "BookingPriceSnapshot"
ADD COLUMN "nightlyRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "accommodationSubtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "extraAdultFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "childrenFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "cleaningFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "tourismTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "pricingRuleId" TEXT NOT NULL DEFAULT 'LEGACY',
ADD COLUMN "pricingRuleVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "BookingPriceSnapshot" ALTER COLUMN "nightlyRate" DROP DEFAULT;
ALTER TABLE "BookingPriceSnapshot" ALTER COLUMN "accommodationSubtotal" DROP DEFAULT;
ALTER TABLE "BookingPriceSnapshot" ALTER COLUMN "extraAdultFee" DROP DEFAULT;
ALTER TABLE "BookingPriceSnapshot" ALTER COLUMN "childrenFee" DROP DEFAULT;
ALTER TABLE "BookingPriceSnapshot" ALTER COLUMN "cleaningFee" DROP DEFAULT;
ALTER TABLE "BookingPriceSnapshot" ALTER COLUMN "pricingRuleId" DROP DEFAULT;
ALTER TABLE "BookingPriceSnapshot" ALTER COLUMN "pricingRuleVersion" DROP DEFAULT;

CREATE TABLE "BookingRequestIdempotency" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "response" JSONB NOT NULL,
  "bookingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookingRequestIdempotency_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BookingRequestIdempotency_key_key" ON "BookingRequestIdempotency"("key");
CREATE UNIQUE INDEX "BookingRequestIdempotency_bookingId_key" ON "BookingRequestIdempotency"("bookingId");
CREATE INDEX "BookingRequestIdempotency_expiresAt_idx" ON "BookingRequestIdempotency"("expiresAt");
ALTER TABLE "BookingRequestIdempotency" ADD CONSTRAINT "BookingRequestIdempotency_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
