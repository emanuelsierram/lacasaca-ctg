export type CheckoutInput = {
  cartItems: Array<{ variantId: string; quantity: number; unitPrice: number }>;
  paymentMethod: 'CASH_ON_DELIVERY' | 'WHATSAPP_TRANSFER';
  guestCheckout?: boolean;
};

const inventoryByVariant: Record<string, number> = {
  'var-1': 12,
  'var-2': 0,
  'var-3': 4,
  'var-4': 10
};

import { pricingService } from './pricing.service';
import { inventoryService } from './inventory.service';

export const checkoutService = {
  createOrder(input: CheckoutInput) {
    const definedShippingCost = 9.99;
    const totalBeforeShipping = input.cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const shippingCost = totalBeforeShipping > 0 ? definedShippingCost : 0;

    for (const item of input.cartItems) {
      const stock = inventoryByVariant[item.variantId] ?? 0;
      inventoryService.validateStock(item.variantId, item.quantity, stock);
    }

    const items = input.cartItems.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      unitPriceSnapshot: pricingService.toMoney(item.unitPrice),
      subtotal: pricingService.calculateLineSubtotal(item.unitPrice, item.quantity),
      productName: item.variantId === 'var-1' ? 'Camiseta FC Barcelona 2024' : 'Camiseta Argentina Retro 1986'
    }));

    const order = {
      id: `order-${Date.now()}`,
      status: 'PENDIENTE' as const,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'PENDING' as const,
      total: pricingService.toMoney(totalBeforeShipping + shippingCost),
      items
    };

    for (const item of input.cartItems) {
      inventoryByVariant[item.variantId] = (inventoryByVariant[item.variantId] ?? 0) - item.quantity;
    }

    return order;
  }
};
