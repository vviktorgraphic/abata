export type ChildRate = { minAge: number; maxAge: number; nightlyFee: number };

export type PricingRuleData = {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  nightlyRate: number;
  currency: string;
  minimumNights: number;
  maximumNights: number | null;
  baseGuestCount: number;
  extraAdultFee: number;
  childRates: ChildRate[];
  cleaningFee: number;
  version: number;
  priority: number;
  active: boolean;
};

export type PriceCalculation = {
  nights: number;
  nightlyRate: number;
  accommodationSubtotal: number;
  extraAdultFee: number;
  childrenFee: number;
  cleaningFee: number;
  tourismTax: number;
  discount: number;
  total: number;
  currency: "HUF";
  pricingRuleId: string;
  pricingRuleVersion: number;
};

export class PricingError extends Error {
  constructor(public readonly code: "NO_PRICING_RULE" | "AMBIGUOUS_PRICING_RULE" | "INVALID_PRICING_RULE", message: string) {
    super(message);
    this.name = "PricingError";
  }
}
