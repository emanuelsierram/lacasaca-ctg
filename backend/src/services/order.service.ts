export type OrderAccessRecord = {
  id: string;
  userId: string | null;
  status?: string;
  paymentStatus?: string;
  total?: number;
  createdAt?: string;
};

const allowedTransitions: Record<string, string[]> = {
  PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ENVIADO', 'CANCELADO'],
  ENVIADO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: []
};

export const orderService = {
  getOrderForUser<T extends OrderAccessRecord>(orders: T[], userId: string, orderId: string) {
    const isAdmin = userId === 'admin';
    const order = orders.find((entry) => entry.id === orderId);
    if (!order) {
      return null;
    }
    if (isAdmin || order.userId === userId) {
      return order;
    }
    return null;
  },

  listOrdersForUser<T extends OrderAccessRecord>(orders: T[], userId: string) {
    const isAdmin = userId === 'admin';
    return orders.filter((order) => isAdmin || order.userId === userId);
  },

  canCancel(order: { status?: string }) {
    return order.status === 'PENDIENTE' || order.status === 'EN_PREPARACION';
  },

  canAdvanceStatus(order: { status?: string }, nextStatus: string) {
    const current = order.status ?? 'PENDIENTE';
    return (allowedTransitions[current] ?? []).includes(nextStatus);
  },

  advanceStatus(order: { status?: string }, nextStatus: string) {
    const current = order.status ?? 'PENDIENTE';
    if (!allowedTransitions[current]?.includes(nextStatus)) {
      throw new Error('Invalid order status transition');
    }
    order.status = nextStatus;
    return order;
  }
};
