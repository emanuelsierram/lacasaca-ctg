export const MADE_TO_ORDER_SURCHARGES = {
  longSleeves: 20000,
  tournament: 5000,
  dorsal: 20000
} as const;

export function madeToOrderPrice(basePrice: number, attributes: { longSleeves: boolean; tournament: string; dorsal: string }) {
  return basePrice
    + (attributes.longSleeves ? MADE_TO_ORDER_SURCHARGES.longSleeves : 0)
    + (attributes.tournament ? MADE_TO_ORDER_SURCHARGES.tournament : 0)
    + (attributes.dorsal.trim() ? MADE_TO_ORDER_SURCHARGES.dorsal : 0);
}

export function immediatePrice(basePrice: number, dorsal: string) {
  return basePrice + (dorsal.trim() ? MADE_TO_ORDER_SURCHARGES.dorsal : 0);
}
