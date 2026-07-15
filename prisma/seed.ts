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
        create: { numberOfNights: 5, subtotal: 250000, total: 250000, currency: "HUF", breakdown: { nightlyRate: 50000 } },
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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
