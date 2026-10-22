import pricing from '@lacasaca/shared/pricing';

export function madeToOrderPrice(basePrice: number, attributes: { longSleeves: boolean; tournament: string; dorsal: string }) {
  return basePrice
    + (attributes.longSleeves ? pricing.longSleeves : 0)
    + (attributes.tournament ? pricing.tournament : 0)
    + (attributes.dorsal.trim() ? pricing.dorsal : 0);
}

export function immediatePrice(basePrice: number, dorsal: string) {
  return basePrice;
}
