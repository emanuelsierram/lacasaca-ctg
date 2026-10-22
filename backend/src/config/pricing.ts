import pricing from '@lacasaca/shared/pricing';

export function madeToOrderPrice(basePrice: number, attributes: Record<string, string | boolean>) {
  return basePrice
    + (attributes['long-sleeves'] === true ? pricing.longSleeves : 0)
    + (typeof attributes.tournament === 'string' && attributes.tournament.trim() ? pricing.tournament : 0)
    + (typeof attributes.dorsal === 'string' && attributes.dorsal.trim() ? pricing.dorsal : 0);
}

export function immediatePrice(basePrice: number, attributes: Record<string, string | boolean> = {}) {
  return basePrice;
}
