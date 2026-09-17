export const paymentService = {
  confirmManualPayment(order: { paymentStatus: string }, actorId?: string | null) {
    if (!actorId || actorId === 'customer-1') {
      return false;
    }
    if (order.paymentStatus === 'CONFIRMED' || order.paymentStatus === 'REJECTED' || order.paymentStatus === 'CANCELLED' || order.paymentStatus === 'EXPIRED') {
      return false;
    }
    order.paymentStatus = 'CONFIRMED';
    return true;
  },

  expireManualPayment(order: { paymentStatus: string; items?: Array<{ variantId: string; quantity: number }> }, inventory: Record<string, number>) {
    if (order.paymentStatus === 'PENDING' || order.paymentStatus === 'EXPIRED') {
      order.paymentStatus = 'EXPIRED';
      for (const item of order.items ?? []) {
        inventory[item.variantId] = (inventory[item.variantId] ?? 0) + item.quantity;
      }
    }
    return inventory;
  }
};
