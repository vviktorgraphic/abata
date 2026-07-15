CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'QUOTED', 'AWAITING_APPROVAL', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'ICAL_IMPORTED');

DROP INDEX "Booking_unitId_checkInAt_checkOutAt_idx";
ALTER TABLE "Booking" DROP COLUMN "checkInAt", DROP COLUMN "checkOutAt", DROP COLUMN "phone", DROP COLUMN "priceSnapshot",
ADD COLUMN "adultCount" INTEGER NOT NULL,
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "checkInDate" DATE NOT NULL,
ADD COLUMN "checkOutDate" DATE NOT NULL,
ADD COLUMN "childCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "confirmedAt" TIMESTAMP(3),
ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'HUF',
ADD COLUMN "guestPhone" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "publicReference" TEXT NOT NULL,
ADD COLUMN "quotedTotal" DECIMAL(12,2),
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'DIRECT',
ALTER COLUMN "guestEmail" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN "status" "BookingStatus" NOT NULL DEFAULT 'PENDING';

CREATE TABLE "BookingGuest" ("id" TEXT NOT NULL, "bookingId" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT, "phone" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "BookingGuest_pkey" PRIMARY KEY ("id"));
CREATE TABLE "BookingChild" ("id" TEXT NOT NULL, "bookingId" TEXT NOT NULL, "age" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "BookingChild_pkey" PRIMARY KEY ("id"));
CREATE TABLE "BookingStatusHistory" ("id" TEXT NOT NULL, "bookingId" TEXT NOT NULL, "fromStatus" "BookingStatus", "toStatus" "BookingStatus" NOT NULL, "reason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id"));
CREATE TABLE "CalendarBlock" ("id" TEXT NOT NULL, "unitId" TEXT NOT NULL, "startDate" DATE NOT NULL, "endDate" DATE NOT NULL, "reason" TEXT, "source" TEXT NOT NULL DEFAULT 'MANUAL', "externalUid" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CalendarBlock_pkey" PRIMARY KEY ("id"));
CREATE TABLE "PricingRule" ("id" TEXT NOT NULL, "unitId" TEXT NOT NULL, "name" TEXT NOT NULL, "startDate" DATE, "endDate" DATE, "nightlyRate" DECIMAL(12,2) NOT NULL, "currency" VARCHAR(3) NOT NULL DEFAULT 'HUF', "minimumNights" INTEGER NOT NULL DEFAULT 1, "priority" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id"));
CREATE TABLE "BookingPriceSnapshot" ("id" TEXT NOT NULL, "bookingId" TEXT NOT NULL, "numberOfNights" INTEGER NOT NULL, "subtotal" DECIMAL(12,2) NOT NULL, "total" DECIMAL(12,2) NOT NULL, "currency" VARCHAR(3) NOT NULL, "breakdown" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "BookingPriceSnapshot_pkey" PRIMARY KEY ("id"));

CREATE INDEX "BookingGuest_bookingId_idx" ON "BookingGuest"("bookingId");
CREATE INDEX "BookingChild_bookingId_idx" ON "BookingChild"("bookingId");
CREATE INDEX "BookingStatusHistory_bookingId_createdAt_idx" ON "BookingStatusHistory"("bookingId", "createdAt");
CREATE UNIQUE INDEX "CalendarBlock_externalUid_key" ON "CalendarBlock"("externalUid");
CREATE INDEX "CalendarBlock_unitId_startDate_endDate_idx" ON "CalendarBlock"("unitId", "startDate", "endDate");
CREATE INDEX "PricingRule_unitId_active_startDate_endDate_idx" ON "PricingRule"("unitId", "active", "startDate", "endDate");
CREATE UNIQUE INDEX "BookingPriceSnapshot_bookingId_key" ON "BookingPriceSnapshot"("bookingId");
CREATE UNIQUE INDEX "Booking_publicReference_key" ON "Booking"("publicReference");
CREATE INDEX "Booking_unitId_checkInDate_checkOutDate_idx" ON "Booking"("unitId", "checkInDate", "checkOutDate");
CREATE INDEX "Booking_unitId_status_checkInDate_checkOutDate_idx" ON "Booking"("unitId", "status", "checkInDate", "checkOutDate");

ALTER TABLE "BookingGuest" ADD CONSTRAINT "BookingGuest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingChild" ADD CONSTRAINT "BookingChild_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarBlock" ADD CONSTRAINT "CalendarBlock_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AccommodationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AccommodationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingPriceSnapshot" ADD CONSTRAINT "BookingPriceSnapshot_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
