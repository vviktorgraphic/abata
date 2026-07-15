import { z } from "zod";
import { PricingError, type PriceCalculation, type PricingRuleData } from "./types";

const childRatesSchema = z.array(z.object({ minAge: z.number().int().min(0), maxAge: z.number().int().max(17), nightlyFee: z.number().min(0) }));

export function calculatePrice(rule: PricingRuleData, nights: number, adultCount: number, childAges: readonly number[]): PriceCalculation {
  if (nights < 1 || adultCount < 1) throw new PricingError("INVALID_PRICING_RULE", "Érvénytelen árazási bemenet.");
  const parsedRates = childRatesSchema.safeParse(rule.childRates);
  if (!parsedRates.success) throw new PricingError("INVALID_PRICING_RULE", "Az árszabály gyermekdíjai érvénytelenek.");

  const accommodationSubtotal = rule.nightlyRate * nights;
  const extraAdultFee = Math.max(0, adultCount - rule.baseGuestCount) * rule.extraAdultFee * nights;
  const childrenFee = childAges.reduce((sum, age) => {
    const rates = parsedRates.data.filter((rate) => age >= rate.minAge && age <= rate.maxAge);
    if (rates.length !== 1) throw new PricingError("INVALID_PRICING_RULE", `A(z) ${age} éves korhoz nem tartozik egyértelmű gyermekdíj.`);
    return sum + rates[0]!.nightlyFee * nights;
  }, 0);
  const tourismTax = 0;
  const discount = 0;
  const total = accommodationSubtotal + extraAdultFee + childrenFee + rule.cleaningFee + tourismTax - discount;
  return {
    nights, nightlyRate: rule.nightlyRate, accommodationSubtotal, extraAdultFee, childrenFee,
    cleaningFee: rule.cleaningFee, tourismTax, discount, total, currency: "HUF",
    pricingRuleId: rule.id, pricingRuleVersion: rule.version,
  };
}
