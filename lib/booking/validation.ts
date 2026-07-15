import { z } from "zod";

const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

export const bookingFormSchema = z
  .object({
    checkIn: z.string().regex(dateOnly, "Válassz érkezési dátumot."),
    checkOut: z.string().regex(dateOnly, "Válassz távozási dátumot."),
    name: z.string().trim().min(1, "A név megadása kötelező."),
    email: z.email("Adj meg érvényes e-mail-címet."),
    phone: z.string().trim().min(1, "A telefonszám megadása kötelező."),
    adultCount: z.number().int().min(1, "Legalább egy felnőtt szükséges."),
    childCount: z.number().int().min(0, "A gyermekek száma nem lehet negatív."),
    childAges: z.array(z.number().int().min(0).max(17)),
    notes: z.string(),
    privacyAccepted: z.literal(true, { error: "Az adatkezelési hozzájárulás kötelező." }),
  })
  .superRefine((data, context) => {
    if (data.childAges.length !== data.childCount) {
      context.addIssue({ code: "custom", path: ["childAges"], message: "Minden gyermek életkorát add meg." });
    }
    if (dateOnly.test(data.checkIn) && dateOnly.test(data.checkOut) && data.checkOut <= data.checkIn) {
      context.addIssue({ code: "custom", path: ["checkOut"], message: "A távozásnak későbbinek kell lennie az érkezésnél." });
    }
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export function synchronizeChildAges(ages: readonly (number | undefined)[], childCount: number): Array<number | undefined> {
  return Array.from({ length: Math.max(0, childCount) }, (_, index) => ages[index]);
}
