import { BookingStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const unit = await prisma.accommodationUnit.upsert({
    where: { slug: "demo-apartman" },
    update: {},
    create: { name: "Demo apartman", slug: "demo-apartman", description: "Fejlesztői szállásegység" },
  });

  await prisma.booking.upsert({
    where: { publicReference: "DEV-CONFIRMED-001" },
    update: {},
    create: {
      publicReference: "DEV-CONFIRMED-001",
      unitId: unit.id,
      checkInDate: new Date("2030-07-05T00:00:00.000Z"),
      checkOutDate: new Date("2030-07-10T00:00:00.000Z"),
      status: BookingStatus.CONFIRMED,
      guestName: "Teszt Vendég",
      guestEmail: "teszt@example.test",
      adultCount: 2,
      childCount: 1,
      quotedTotal: 250000,
      children: { create: [{ age: 8 }] },
      statusHistory: { create: [{ toStatus: BookingStatus.CONFIRMED, reason: "Fejlesztői seed" }] },
      priceSnapshot: {
        create: {
          numberOfNights: 5, subtotal: 250000, nightlyRate: 50000, accommodationSubtotal: 250000,
          extraAdultFee: 0, childrenFee: 0, cleaningFee: 0, tourismTax: 0, discount: 0,
          total: 250000, currency: "HUF", pricingRuleId: "LEGACY-SEED", pricingRuleVersion: 1,
          breakdown: { nightlyRate: 50000 },
        },
      },
    },
  });

  await prisma.booking.upsert({
    where: { publicReference: "DEV-CANCELLED-001" },
    update: {},
    create: {
      publicReference: "DEV-CANCELLED-001",
      unitId: unit.id,
      checkInDate: new Date("2030-08-01T00:00:00.000Z"),
      checkOutDate: new Date("2030-08-04T00:00:00.000Z"),
      status: BookingStatus.CANCELLED,
      guestName: "Lemondott Vendég",
      guestEmail: "lemondott@example.test",
      adultCount: 1,
      cancelledAt: new Date(),
    },
  });

  const existingBlock = await prisma.calendarBlock.findFirst({ where: { unitId: unit.id, source: "DEV_SEED" } });
  if (!existingBlock) {
    await prisma.calendarBlock.create({
      data: {
        unitId: unit.id,
        startDate: new Date("2030-09-12T00:00:00.000Z"),
        endDate: new Date("2030-09-16T00:00:00.000Z"),
        reason: "Karbantartás",
        source: "DEV_SEED",
      },
    });
  }

  const bands = [
    { name: "1 éjszakás ársáv", minimumNights: 1, maximumNights: 1, nightlyRate: 45000 },
    { name: "2 éjszakás ársáv", minimumNights: 2, maximumNights: 2, nightlyRate: 38000 },
    { name: "3–4 éjszakás ársáv", minimumNights: 3, maximumNights: 4, nightlyRate: 34000 },
    { name: "5–7 éjszakás ársáv", minimumNights: 5, maximumNights: 7, nightlyRate: 30000 },
    { name: "8+ éjszakás ársáv", minimumNights: 8, maximumNights: null, nightlyRate: 27000 },
  ];
  for (const band of bands) {
    const data = {
      ...band, unitId: unit.id, currency: "HUF", baseGuestCount: 2, extraAdultFee: 7000,
      childRates: [{ minAge: 0, maxAge: 5, nightlyFee: 0 }, { minAge: 6, maxAge: 11, nightlyFee: 3000 }, { minAge: 12, maxAge: 17, nightlyFee: 5000 }],
      cleaningFee: 15000, version: 1, priority: 100, active: true,
    };
    const existing = await prisma.pricingRule.findFirst({ where: { unitId: unit.id, name: band.name } });
    if (existing) await prisma.pricingRule.update({ where: { id: existing.id }, data });
    else await prisma.pricingRule.create({ data });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
