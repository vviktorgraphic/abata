import { describe, expect, it } from "vitest";
import { calculatePrice } from "@/lib/pricing/calculate-price";
import { selectPricingRule } from "@/lib/pricing/select-pricing-rule";
import { PricingError, type PricingRuleData } from "@/lib/pricing/types";

const band = (id: string, minimumNights: number, maximumNights: number | null, nightlyRate: number, overrides: Partial<PricingRuleData> = {}): PricingRuleData => ({
  id, name: id, startDate: null, endDate: null, nightlyRate, currency: "HUF", minimumNights, maximumNights,
  baseGuestCount: 2, extraAdultFee: 7000, childRates: [{ minAge: 0, maxAge: 5, nightlyFee: 0 }, { minAge: 6, maxAge: 11, nightlyFee: 3000 }, { minAge: 12, maxAge: 17, nightlyFee: 5000 }],
  cleaningFee: 15000, version: 1, priority: 100, active: true, ...overrides,
});
const rules = [band("one", 1, 1, 45000), band("two", 2, 2, 38000), band("three-four", 3, 4, 34000), band("five-seven", 5, 7, 30000), band("eight", 8, null, 27000)];

describe("pricing rule selection", () => {
  it.each([[1, "one"], [2, "two"], [3, "three-four"], [4, "three-four"], [5, "five-seven"], [7, "five-seven"], [8, "eight"], [14, "eight"]])("selects the correct band for %i nights", (nights, id) => {
    expect(selectPricingRule(rules, nights, new Date("2030-07-01")).id).toBe(id);
  });

  it("ignores inactive rules", () => {
    expect(selectPricingRule([band("inactive", 1, 1, 1, { active: false }), rules[0]!], 1, new Date("2030-07-01")).id).toBe("one");
  });

  it("throws when no rule matches", () => {
    expect(() => selectPricingRule([], 3, new Date("2030-07-01"))).toThrow(PricingError);
  });

  it("throws for ambiguous highest-priority rules", () => {
    expect(() => selectPricingRule([band("a", 1, 3, 1), band("b", 2, 4, 1)], 2, new Date("2030-07-01"))).toThrow("azonos prioritású");
  });
});

describe("price calculation", () => {
  it("calculates extra adults, child age bands, cleaning and totals", () => {
    expect(calculatePrice(rules[2]!, 3, 3, [4, 8, 15])).toEqual({
      nights: 3, nightlyRate: 34000, accommodationSubtotal: 102000, extraAdultFee: 21000,
      childrenFee: 24000, cleaningFee: 15000, tourismTax: 0, discount: 0, total: 162000,
      currency: "HUF", pricingRuleId: "three-four", pricingRuleVersion: 1,
    });
  });

  it("applies cleaning as a one-time fee", () => {
    expect(calculatePrice(rules[0]!, 1, 2, []).cleaningFee).toBe(15000);
    expect(calculatePrice(rules[3]!, 7, 2, []).cleaningFee).toBe(15000);
  });
});
