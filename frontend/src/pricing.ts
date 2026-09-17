export const MADE_TO_ORDER_SURCHARGES = {
  longSleeves: 5,
  tournament: 2,
  dorsal: 5
} as const;

export function madeToOrderPrice(basePrice: number, attributes: { longSleeves: boolean; tournament: string; dorsal: string }) {
  return basePrice
    + (attributes.longSleeves ? MADE_TO_ORDER_SURCHARGES.longSleeves : 0)
    + (attributes.tournament ? MADE_TO_ORDER_SURCHARGES.tournament : 0)
    + (attributes.dorsal.trim() ? MADE_TO_ORDER_SURCHARGES.dorsal : 0);
}
