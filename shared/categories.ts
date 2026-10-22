export const PRODUCT_CATEGORIES = [
  'RETROS',
  'ACTUALES',
  'SELECCIONES',
  'FEMENINO',
  'NINOS',
  'ESPECIALES'
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
