import { PricingError, type PricingRuleData } from "./types";

export function selectPricingRule(rules: readonly PricingRuleData[], nights: number, checkInDate: Date): PricingRuleData {
  const matching = rules.filter((rule) =>
    rule.active &&
    rule.currency === "HUF" &&
    nights >= rule.minimumNights &&
    (rule.maximumNights === null || nights <= rule.maximumNights) &&
    (rule.startDate === null || checkInDate >= rule.startDate) &&
    (rule.endDate === null || checkInDate < rule.endDate),
  );
  if (matching.length === 0) throw new PricingError("NO_PRICING_RULE", "Nincs alkalmazható árszabály a kiválasztott időszakra.");
  const highestPriority = Math.max(...matching.map((rule) => rule.priority));
  const winners = matching.filter((rule) => rule.priority === highestPriority);
  if (winners.length !== 1) throw new PricingError("AMBIGUOUS_PRICING_RULE", "Több azonos prioritású árszabály alkalmazható.");
  return winners[0]!;
}
