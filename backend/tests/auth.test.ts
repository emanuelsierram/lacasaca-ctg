import assert from 'node:assert/strict';
import test from 'node:test';

import { orderService } from '../src/services/order.service';
import { userService } from '../src/services/user.service';

test('user registration rejects duplicate emails and stores a strong password hash', () => {
  const users: Array<{ id: string; email: string; passwordHash: string; name: string; role: 'CUSTOMER' | 'ADMIN' }> = [];

  const created = userService.registerUser(users, {
    name: 'Ana Buyer',
    email: 'ana@example.com',
    password: 'Secret123!'
  });

  assert.equal(created.email, 'ana@example.com');
  assert.notEqual(created.passwordHash, 'Secret123!');
  assert.equal(created.role, 'CUSTOMER');

  assert.throws(
    () =>
      userService.registerUser(users, {
        name: 'Another',
        email: 'ana@example.com',
        password: 'Nope123!'
      }),
    /already exists/
  );
});

test('user login returns the session user only when the password matches', () => {
  const users: Array<{ id: string; email: string; passwordHash: string; name: string; role: 'CUSTOMER' | 'ADMIN' }> = [];

  userService.registerUser(users, {
    name: 'Luis',
    email: 'luis@example.com',
    password: 'Pass123!'
  });

  const validSession = userService.loginUser(users, {
    email: 'luis@example.com',
    password: 'Pass123!'
  });

  const invalidSession = userService.loginUser(users, {
    email: 'luis@example.com',
    password: 'wrong-password'
  });

  assert.equal(validSession.email, 'luis@example.com');
  assert.equal(validSession.role, 'CUSTOMER');
  assert.equal(invalidSession, null);
});

test('order service restricts reads to the owner or admin', () => {
  const orders = [
    { id: 'order-1', userId: 'user-a', status: 'PENDIENTE', total: 149, createdAt: '2026-09-01' },
    { id: 'order-2', userId: 'user-b', status: 'ENVIADO', total: 89, createdAt: '2026-09-02' }
  ] as const;

  const userAOrders = orderService.listOrdersForUser(orders as any, 'user-a');
  const adminOrders = orderService.listOrdersForUser(orders as any, 'admin');
  const userAOrder = orderService.getOrderForUser(orders as any, 'user-a', 'order-1');
  const forbidden = orderService.getOrderForUser(orders as any, 'user-a', 'order-2');

  assert.equal(userAOrders.length, 1);
  assert.equal(adminOrders.length, 2);
  assert.equal(userAOrder?.id, 'order-1');
  assert.equal(forbidden, null);
});
