import assert from 'node:assert/strict';
import test from 'node:test';

import { cartService } from '../src/services/cart.service';

test('cart service adds a valid item and recalculates totals', () => {
  const cartId = 'cart-1';
  const cart = cartService.addItem(cartId, 'var-1', 2);

  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].quantity, 2);
  assert.equal(cart.items[0].subtotal, 259.98);
  assert.equal(cart.total, 259.98);
});

test('cart service rejects invalid quantity or unavailable variant', () => {
  assert.throws(() => cartService.addItem('cart-2', 'var-2', 1), /not available/i);
  assert.throws(() => cartService.updateItem('cart-2', 'missing', 0), /not found/i);
});
