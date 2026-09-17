export const paymentService = {
  confirmManualPayment(order: { paymentStatus: string }, actorId?: string | null) {
    if (!actorId || actorId === 'customer-1') {
      return false;
    }
    if (order.paymentStatus === 'CONFIRMADO' || order.paymentStatus === 'RECHAZADO' || order.paymentStatus === 'CANCELADO' || order.paymentStatus === 'EXPIRADO') {
      return false;
    }
    order.paymentStatus = 'CONFIRMADO';
    return true;
  },

  expireManualPayment(order: { paymentStatus: string; items?: Array<{ variantId: string; quantity: number }> }, inventory: Record<string, number>) {
    if (order.paymentStatus === 'PENDIENTE' || order.paymentStatus === 'EXPIRADO') {
      order.paymentStatus = 'EXPIRADO';
      for (const item of order.items ?? []) {
        inventory[item.variantId] = (inventory[item.variantId] ?? 0) + item.quantity;
      }
    }
    return inventory;
  }
};
