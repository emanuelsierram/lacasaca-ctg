import assert from 'node:assert/strict';
import test from 'node:test';

import { orderService } from '../src/services/order.service';
import { paymentService } from '../src/services/payment.service';

test('order lifecycle blocks invalid transitions and allows cancellation only in valid states', () => {
  const order = {
    id: 'order-a',
    userId: 'user-a',
    status: 'PENDIENTE',
    paymentStatus: 'PENDIENTE',
    total: 119.99,
    createdAt: '2026-09-01T00:00:00Z'
  };

  assert.equal(orderService.canCancel(order as any), true);
  assert.equal(orderService.canAdvanceStatus(order as any, 'EN_PREPARACION'), true);
  assert.equal(orderService.canAdvanceStatus(order as any, 'ENTREGADO'), false);
  assert.throws(() => orderService.advanceStatus(order as any, 'ENTREGADO'), /Invalid order status transition/);
});

test('payment confirmation rejects duplicate confirmations and restores inventory for expired manual payments', () => {
  const inventory = { 'var-9': 2 };
  const order = {
    id: 'order-b',
    userId: 'user-b',
    status: 'PENDIENTE',
    paymentStatus: 'PENDIENTE',
    total: 89,
    items: [{ variantId: 'var-9', quantity: 2 }],
    createdAt: '2026-09-01T00:00:00Z'
  };

  assert.equal(paymentService.confirmManualPayment(order as any, 'admin-1'), true);
  assert.equal(paymentService.confirmManualPayment(order as any, 'admin-1'), false);

  order.paymentStatus = 'PENDIENTE';
  const restored = paymentService.expireManualPayment(order as any, inventory as any);
  assert.equal(restored['var-9'], 4);
  assert.equal(order.paymentStatus, 'EXPIRADO');
});
