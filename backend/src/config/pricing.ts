export const MADE_TO_ORDER_SURCHARGES = {
  longSleeves: 20000,
  tournament: 5000,
  dorsal: 20000
} as const;

export function madeToOrderPrice(basePrice: number, attributes: Record<string, string | boolean>) {
  return basePrice
    + (attributes['long-sleeves'] === true ? MADE_TO_ORDER_SURCHARGES.longSleeves : 0)
    + (typeof attributes.tournament === 'string' && attributes.tournament.trim() ? MADE_TO_ORDER_SURCHARGES.tournament : 0)
    + (typeof attributes.dorsal === 'string' && attributes.dorsal.trim() ? MADE_TO_ORDER_SURCHARGES.dorsal : 0);
}

export function immediatePrice(basePrice: number, attributes: Record<string, string | boolean> = {}) {
  return basePrice + (typeof attributes.dorsal === 'string' && attributes.dorsal.trim() ? MADE_TO_ORDER_SURCHARGES.dorsal : 0);
}
