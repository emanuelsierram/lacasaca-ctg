export const pricingService = {
  toMoney(value: number) {
    return Number(value.toFixed(2));
  },

  calculateLineSubtotal(unitPrice: number, quantity: number) {
    return this.toMoney(unitPrice * quantity);
  },

  calculateOrderTotal(items: Array<{ unitPrice: number; quantity: number }>, shippingCost = 0) {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return this.toMoney(subtotal + shippingCost);
  },

  createSnapshot(unitPrice: number, quantity: number) {
    return {
      unitPriceSnapshot: this.toMoney(unitPrice),
      subtotal: this.calculateLineSubtotal(unitPrice, quantity)
    };
  }
};
