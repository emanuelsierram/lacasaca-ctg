import assert from 'node:assert/strict';
import test from 'node:test';

import { catalogService } from '../src/services/catalog.service';
import { checkoutService } from '../src/services/checkout.service';

test('catalog service filters products by category and search', () => {
  const result = catalogService.listProducts({ category: 'RETROS', search: 'argentina' });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].category, 'RETROS');
  assert.match(result.items[0].name, /Argentina/);
});

test('checkout service rejects quantities above stock', () => {
  assert.throws(
    () =>
      checkoutService.createOrder({
        cartItems: [{ variantId: 'var-3', quantity: 99, unitPrice: 149 }],
        paymentMethod: 'CASH_ON_DELIVERY',
        guestCheckout: true
      }),
    /Insufficient stock/
  );
});

test('catalog service hides inactive variants and returns only active catalog results', () => {
  const activeOnly = catalogService.listProducts({ category: 'ACTUALES' });

  assert.equal(activeOnly.items.length, 1);
  assert.ok(activeOnly.items[0].variants.every((variant) => variant.isActive));
  assert.equal(activeOnly.items[0].name, 'Camiseta FC Barcelona 2024');

  const noCategory = catalogService.listProducts({ category: 'INVALID' });
  assert.deepEqual(noCategory.items, []);
});

test('checkout service creates order with server-calculated total and price snapshot', () => {
  const order = checkoutService.createOrder({
    cartItems: [{ variantId: 'var-1', quantity: 1, unitPrice: 129.99 }],
    paymentMethod: 'WHATSAPP_TRANSFER',
    guestCheckout: true
  });

  assert.equal(order.paymentStatus, 'PENDING');
  assert.equal(order.status, 'PENDIENTE');
  assert.equal(order.total, 139.98);
  assert.equal(order.items[0].unitPriceSnapshot, 129.99);
  assert.equal(order.items[0].subtotal, 129.99);
});
