import { pricingService } from './pricing.service';

export type CartItemView = {
  id: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

const carts: Record<string, { id: string; items: CartItemView[] }> = {};

const variantCatalog: Record<string, { productName: string; label: string; price: number; stock: number; isActive: boolean }> = {
  'var-1': { productName: 'Camiseta FC Barcelona 2024', label: 'M - Home', price: 129.99, stock: 12, isActive: true },
  'var-2': { productName: 'Camiseta FC Barcelona 2024', label: 'L - Home', price: 129.99, stock: 0, isActive: true },
  'var-3': { productName: 'Camiseta Argentina Retro 1986', label: 'M - Retro', price: 149, stock: 4, isActive: true }
};

export const cartService = {
  getCart(cartId: string) {
    if (!carts[cartId]) {
      carts[cartId] = { id: cartId, items: [] };
    }
    return {
      id: carts[cartId].id,
      items: carts[cartId].items,
      total: carts[cartId].items.reduce((sum, item) => sum + item.subtotal, 0)
    };
  },

  addItem(cartId: string, variantId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive integer');
    }

    const variant = variantCatalog[variantId];
    if (!variant || !variant.isActive || variant.stock <= 0) {
      throw new Error('Variant not available');
    }

    if (quantity > variant.stock) {
      throw new Error('Requested quantity exceeds available stock');
    }

    if (!carts[cartId]) {
      carts[cartId] = { id: cartId, items: [] };
    }

    const existing = carts[cartId].items.find((item) => item.variantId === variantId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > variant.stock) {
      throw new Error('Requested quantity exceeds available stock');
    }

    const subtotal = pricingService.calculateLineSubtotal(variant.price, nextQuantity);

    const item: CartItemView = {
      id: existing?.id ?? `${cartId}-item-${Date.now()}`,
      variantId,
      productName: variant.productName,
      variantLabel: variant.label,
      unitPrice: variant.price,
      quantity: nextQuantity,
      subtotal
    };

    carts[cartId].items = carts[cartId].items.filter((entry) => entry.variantId !== variantId);
    carts[cartId].items.push(item);

    return this.getCart(cartId);
  },

  updateItem(cartId: string, itemId: string, quantity: number) {
    if (!carts[cartId]) {
      throw new Error('Cart not found');
    }

    const item = carts[cartId].items.find((entry) => entry.id === itemId);
    if (!item) {
      throw new Error('Cart item not found');
    }

    const variant = variantCatalog[item.variantId];
    if (!variant || !variant.isActive) {
      throw new Error('Variant not available');
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive integer');
    }

    if (quantity > variant.stock) {
      throw new Error('Requested quantity exceeds available stock');
    }

    item.quantity = quantity;
    item.subtotal = pricingService.calculateLineSubtotal(item.unitPrice, quantity);

    return this.getCart(cartId);
  },

  removeItem(cartId: string, itemId: string) {
    if (!carts[cartId]) {
      throw new Error('Cart not found');
    }

    carts[cartId].items = carts[cartId].items.filter((entry) => entry.id !== itemId);
    return this.getCart(cartId);
  }
};
