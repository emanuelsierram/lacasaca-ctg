export { PRODUCT_CATEGORIES } from '@lacasaca/shared/categories';
export type { ProductCategory } from '@lacasaca/shared/categories';
export type AvailabilityType = 'IMMEDIATE' | 'MADE_TO_ORDER';
export type OrderStatus = 'PENDIENTE' | 'EN_PREPARACION' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'WHATSAPP_TRANSFER';
export type PaymentStatus = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' | 'EXPIRADO' | 'CANCELADO';
export type UserRole = 'CUSTOMER' | 'ADMIN';

export type VariantRecord = {
  id: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  availabilityType: AvailabilityType;
  attributes: Record<string, string | boolean>;
};

export type OrderItemSnapshot = {
  variantId: string;
  productId: string;
  quantity: number;
  unitPriceSnapshot: number;
  subtotal: number;
};
