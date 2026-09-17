import type { OrderItemSnapshot } from '../models/domain-types';

export const inventoryService = {
  validateStock(variantId: string, quantity: number, available: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive integer');
    }
    if (available < quantity) {
      throw new Error('Insufficient stock');
    }
    if (available < 0) {
      throw new Error('Stock cannot be negative');
    }
    return true;
  },

  reserveStock(variantId: string, quantity: number, stock: number) {
    const next = stock - quantity;
    if (next < 0) {
      throw new Error('Insufficient stock');
    }
    return {
      variantId,
      reservedStock: next
    };
  },

  releaseStock(items: OrderItemSnapshot[], currentStock: Record<string, number>) {
    for (const item of items) {
      currentStock[item.variantId] = (currentStock[item.variantId] ?? 0) + item.quantity;
    }
    return currentStock;
  }
};
