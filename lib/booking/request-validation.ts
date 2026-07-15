import { z } from "zod";

const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
const normalizedText = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum);

export const bookingRequestSchema = z.object({
  checkInDate: z.string().regex(dateOnly, "Érvényes érkezési dátum szükséges."),
  checkOutDate: z.string().regex(dateOnly, "Érvényes távozási dátum szükséges."),
  guestName: normalizedText(1, 200),
  guestEmail: z.email("Érvényes e-mail-cím szükséges.").trim().toLowerCase(),
  guestPhone: normalizedText(1, 50),
  adultCount: z.number().int().min(1).max(20),
  childAges: z.array(z.number().int().min(0).max(17)).max(20),
  notes: z.string().trim().max(2000).default(""),
  privacyAccepted: z.literal(true, { error: "Az adatkezelési hozzájárulás kötelező." }),
}).superRefine((data, context) => {
  const checkIn = new Date(`${data.checkInDate}T00:00:00.000Z`);
  const checkOut = new Date(`${data.checkOutDate}T00:00:00.000Z`);
  if (Number.isNaN(checkIn.getTime()) || checkIn.toISOString().slice(0, 10) !== data.checkInDate) {
    context.addIssue({ code: "custom", path: ["checkInDate"], message: "Érvénytelen érkezési dátum." });
  }
  if (Number.isNaN(checkOut.getTime()) || checkOut.toISOString().slice(0, 10) !== data.checkOutDate) {
    context.addIssue({ code: "custom", path: ["checkOutDate"], message: "Érvénytelen távozási dátum." });
  }
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
