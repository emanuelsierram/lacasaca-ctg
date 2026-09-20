import assert from 'node:assert/strict';
import test from 'node:test';

import { immediatePrice, madeToOrderPrice } from '../src/config/pricing';

test('immediate products add only the dorsal surcharge', () => {
  assert.equal(immediatePrice(80000, {}), 80000);
  assert.equal(immediatePrice(80000, { dorsal: '#7 Luis Díaz' }), 100000);
  assert.equal(immediatePrice(80000, { tournament: 'Mundial', 'long-sleeves': true }), 80000);
});

test('made-to-order pricing keeps all existing surcharges', () => {
  assert.equal(
    madeToOrderPrice(80000, { 'long-sleeves': true, tournament: 'Mundial', dorsal: '#10 Messi' }),
    125000
  );
});
