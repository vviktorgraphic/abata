import { createHash, randomBytes } from "node:crypto";
import { BookingStatus, EmailType, Prisma, type PrismaClient } from "@prisma/client";
import { calculateNumberOfNights, checkAvailability, validateBookingDates } from "./domain";
import type { BookingRequestInput } from "./request-validation";
import { calculatePrice } from "@/lib/pricing/calculate-price";
import { selectPricingRule } from "@/lib/pricing/select-pricing-rule";
import { PricingError, type PriceCalculation, type PricingRuleData } from "@/lib/pricing/types";
import { getEmailConfig } from "@/lib/email/config";
import { bookingRequestAdminTemplate, bookingRequestGuestTemplate } from "@/lib/email/templates";

export type BookingResponse = {
  booking: {
    reference: string;
    status: "PENDING";
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    total: number;
    currency: "HUF";
    price: Omit<PriceCalculation, "pricingRuleId">;
  };
};

export class BookingRequestError extends Error {
  constructor(public readonly code: "BOOKING_PERIOD_UNAVAILABLE" | "IDEMPOTENCY_CONFLICT" | "PRICING_UNAVAILABLE" | "ACCOMMODATION_NOT_CONFIGURED", public readonly status: 409 | 500, message: string) {
    super(message);
    this.name = "BookingRequestError";
  }
}

type BookingClient = Pick<PrismaClient, "$transaction">;

function requestHash(input: BookingRequestInput): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function generatePublicReference(now = new Date()): string {
  return `FG-${now.getUTCFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

function asRuleData(rule: {
  id: string; name: string; startDate: Date | null; endDate: Date | null; nightlyRate: Prisma.Decimal; currency: string;
  minimumNights: number; maximumNights: number | null; baseGuestCount: number; extraAdultFee: Prisma.Decimal;
  childRates: Prisma.JsonValue; cleaningFee: Prisma.Decimal; version: number; priority: number; active: boolean;
}): PricingRuleData {
  return { ...rule, nightlyRate: Number(rule.nightlyRate), extraAdultFee: Number(rule.extraAdultFee), cleaningFee: Number(rule.cleaningFee), childRates: rule.childRates as PricingRuleData["childRates"] };
}

export async function createBookingRequest(
  client: BookingClient,
  input: BookingRequestInput,
  idempotencyKey?: string,
  now = new Date(),
): Promise<BookingResponse> {
  const checkInDate = new Date(`${input.checkInDate}T00:00:00.000Z`);
  const checkOutDate = new Date(`${input.checkOutDate}T00:00:00.000Z`);
  validateBookingDates({ checkInDate, checkOutDate, adultCount: input.adultCount, childCount: input.childAges.length, childAges: input.childAges }, now);
  const emailConfig = getEmailConfig();
  const hash = requestHash(input);

  return client.$transaction(async (transaction) => {
    const unit = await transaction.accommodationUnit.findFirst({ select: { id: true } });
    if (!unit) throw new BookingRequestError("ACCOMMODATION_NOT_CONFIGURED", 500, "A szállásegység nincs konfigurálva.");

    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${unit.id}, 0))::text AS lock_result`;

    if (idempotencyKey) {
      const existing = await transaction.bookingRequestIdempotency.findUnique({ where: { key: idempotencyKey } });
      if (existing && existing.expiresAt > now) {
        if (existing.requestHash !== hash) throw new BookingRequestError("IDEMPOTENCY_CONFLICT", 409, "Az idempotenciakulcs már más kéréshez tartozik.");
        return existing.response as unknown as BookingResponse;
      }
      if (existing) await transaction.bookingRequestIdempotency.delete({ where: { key: idempotencyKey } });
    }

    const availability = await checkAvailability(transaction as never, { unitId: unit.id, checkInDate, checkOutDate });
    if (!availability.available) throw new BookingRequestError("BOOKING_PERIOD_UNAVAILABLE", 409, "A kiválasztott időszak már nem elérhető.");

    const nights = calculateNumberOfNights(checkInDate, checkOutDate);
    const rules = await transaction.pricingRule.findMany({ where: { unitId: unit.id, active: true } });
    let price: PriceCalculation;
    try {
      const rule = selectPricingRule(rules.map(asRuleData), nights, checkInDate);
      price = calculatePrice(rule, nights, input.adultCount, input.childAges);
    } catch (error) {
      if (error instanceof PricingError) throw new BookingRequestError("PRICING_UNAVAILABLE", 500, "Az ár jelenleg nem számítható ki.");
      throw error;
    }

    const reference = generatePublicReference(now);
    const publicPrice = { ...price } as Partial<PriceCalculation>;
    delete publicPrice.pricingRuleId;
    const response: BookingResponse = {
      booking: {
        reference, status: "PENDING", checkInDate: input.checkInDate, checkOutDate: input.checkOutDate,
        nights, total: price.total, currency: "HUF", price: publicPrice as Omit<PriceCalculation, "pricingRuleId">,
      },
    };
    const emailData = {
      publicReference: reference, guestName: input.guestName, guestEmail: input.guestEmail,
      guestPhone: input.guestPhone, checkInDate: input.checkInDate, checkOutDate: input.checkOutDate,
      nights, adultCount: input.adultCount, childAges: input.childAges, notes: input.notes,
      createdAt: now, price, appName: emailConfig.appName,
      contactEmail: emailConfig.replyTo || emailConfig.fromAddress,
    };
    const guestEmail = bookingRequestGuestTemplate(emailData);
    const adminEmail = bookingRequestAdminTemplate(emailData);

    const booking = await transaction.booking.create({
      data: {
        publicReference: reference, unitId: unit.id, checkInDate, checkOutDate, status: BookingStatus.PENDING,
        guestName: input.guestName, guestEmail: input.guestEmail, guestPhone: input.guestPhone,
        adultCount: input.adultCount, childCount: input.childAges.length, notes: input.notes || null,
        source: "DIRECT", quotedTotal: price.total, currency: "HUF", privacyAcceptedAt: now,
        children: { create: input.childAges.map((age) => ({ age })) },
        statusHistory: { create: { toStatus: BookingStatus.PENDING, reason: "Nyilvános foglalási igény" } },
        priceSnapshot: { create: {
          numberOfNights: nights, subtotal: price.accommodationSubtotal, nightlyRate: price.nightlyRate,
          accommodationSubtotal: price.accommodationSubtotal, extraAdultFee: price.extraAdultFee,
          childrenFee: price.childrenFee, cleaningFee: price.cleaningFee, tourismTax: price.tourismTax,
          discount: price.discount, total: price.total, currency: price.currency,
          pricingRuleId: price.pricingRuleId, pricingRuleVersion: price.pricingRuleVersion, breakdown: price,
        } },
      },
      select: { id: true },
    });

    await transaction.emailOutbox.createMany({
      data: [
        {
          type: EmailType.BOOKING_REQUEST_GUEST, recipient: input.guestEmail,
          subject: guestEmail.subject, textBody: guestEmail.text, htmlBody: guestEmail.html,
          bookingId: booking.id, maxAttempts: emailConfig.maxAttempts,
          deduplicationKey: `booking:${booking.id}:guest-request`,
        },
        {
          type: EmailType.BOOKING_REQUEST_ADMIN, recipient: emailConfig.notificationEmail,
          subject: adminEmail.subject, textBody: adminEmail.text, htmlBody: adminEmail.html,
          bookingId: booking.id, maxAttempts: emailConfig.maxAttempts,
          deduplicationKey: `booking:${booking.id}:admin-request`,
        },
      ],
    });

    if (idempotencyKey) {
      await transaction.bookingRequestIdempotency.create({
        data: { key: idempotencyKey, requestHash: hash, response: response as unknown as Prisma.InputJsonValue, bookingId: booking.id, expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      });
    }
    return response;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
