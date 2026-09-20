import { pool } from '../config/database';
import { createHash } from 'node:crypto';
import { immediatePrice, madeToOrderPrice } from '../config/pricing';

export type DbCartItem = {
  id: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  availabilityType: 'IMMEDIATE' | 'MADE_TO_ORDER';
  stock: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export async function ensureCart(cartLegacyId: string, userLegacyId?: string | null) {
  await pool.query(
    `INSERT INTO carts (legacy_id, user_id, guest_session_id)
     VALUES ($1, (SELECT id FROM users WHERE legacy_id = $2), CASE WHEN $2 IS NULL THEN $1 ELSE NULL END)
     ON CONFLICT (legacy_id) DO NOTHING`,
    [cartLegacyId, userLegacyId ?? null]
  );
}

export async function getDbCart(cartLegacyId: string): Promise<{ id: string; items: DbCartItem[]; total: number }> {
  await ensureCart(cartLegacyId);
  const result = await pool.query<DbCartItem>(
     `SELECT ci.legacy_id AS id, v.legacy_id AS "variantId", p.name AS "productName",
      concat_ws(' - ',
        NULLIF(v.attributes->>'size', ''),
        NULLIF(v.attributes->>'version', ''),
        NULLIF(v.attributes->>'tournament', ''),
        NULLIF(v.attributes->>'dorsal', ''),
        CASE WHEN v.attributes->>'long-sleeves' = 'true' THEN 'Manga larga' END
      ) AS "variantLabel",
      v.availability_type AS "availabilityType", v.stock,
       ci.unit_price_snapshot AS "unitPrice", ci.quantity,
       ci.unit_price_snapshot * ci.quantity AS subtotal
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     JOIN variants v ON v.id = ci.variant_id
     JOIN products p ON p.id = v.product_id
     WHERE c.legacy_id = $1 ORDER BY ci.created_at`,
    [cartLegacyId]
  );
  const items = result.rows.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), subtotal: Number(item.subtotal) }));
  return { id: cartLegacyId, items, total: items.reduce((sum, item) => sum + item.subtotal, 0) };
}

export async function addDbCartItem(cartLegacyId: string, variantLegacyId: string, quantity: number, attributes?: Record<string, string | boolean>) {
  await ensureCart(cartLegacyId);
  const variant = await pool.query<{ productName: string; price: number; stock: number; active: boolean; productActive: boolean; availabilityType: 'IMMEDIATE' | 'MADE_TO_ORDER'; productAvailabilityType: 'IMMEDIATE' | 'MADE_TO_ORDER'; productId: string }>(
    `SELECT p.name AS "productName", v.price, v.is_active AS active, p.is_active AS "productActive",
       v.stock,
       v.availability_type AS "availabilityType", p.availability_type AS "productAvailabilityType", p.id AS "productId"
     FROM variants v JOIN products p ON p.id = v.product_id WHERE v.legacy_id = $1`,
    [variantLegacyId]
  );
  const found = variant.rows[0];
  if (!found) throw new Error('Variant not found');
  if (!found.active || !found.productActive) throw new Error('Variant is not active');
  let selectedVariantId = variantLegacyId;
  if (attributes && found.productAvailabilityType === 'MADE_TO_ORDER') {
    const key = JSON.stringify(Object.fromEntries(Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b))));
    selectedVariantId = `made-${variantLegacyId}-${createHash('sha256').update(key).digest('hex').slice(0, 16)}`;
    await pool.query(
      `INSERT INTO variants (legacy_id, product_id, sku, attributes, price, stock, is_active, availability_type)
       VALUES ($1, $2, $3, $4::jsonb, $5, 0, true, 'MADE_TO_ORDER')
       ON CONFLICT (legacy_id) DO NOTHING`,
      [selectedVariantId, found.productId, `SKU-${selectedVariantId}`, JSON.stringify(attributes), found.price]
    );
  }
  if (found.productAvailabilityType === 'IMMEDIATE') {
    const existing = await pool.query<{ quantity: number }>(
      `SELECT ci.quantity FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       JOIN variants v ON v.id = ci.variant_id
       WHERE c.legacy_id = $1 AND v.legacy_id = $2`,
      [cartLegacyId, selectedVariantId]
    );
    const requestedQuantity = Number(existing.rows[0]?.quantity ?? 0) + quantity;
    if (requestedQuantity > Number(found.stock)) throw new Error(`Insufficient stock for ${found.productName}`);
  }
  const unitPrice = found.productAvailabilityType === 'MADE_TO_ORDER'
    ? madeToOrderPrice(Number(found.price), attributes ?? {})
    : immediatePrice(Number(found.price), attributes);
  const legacyItemId = `cart-item-${cartLegacyId}-${selectedVariantId}`;
  await pool.query(
    `INSERT INTO cart_items (legacy_id, cart_id, variant_id, quantity, unit_price_snapshot)
     VALUES ($1, (SELECT id FROM carts WHERE legacy_id = $2), (SELECT id FROM variants WHERE legacy_id = $3), $4, $5)
     ON CONFLICT (legacy_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
       unit_price_snapshot = EXCLUDED.unit_price_snapshot, updated_at = now()`,
     [legacyItemId, cartLegacyId, selectedVariantId, quantity, unitPrice]
  );
  const cart = await getDbCart(cartLegacyId);
  return cart.items.find((item) => item.id === legacyItemId)!;
}

export async function updateDbCartItem(cartLegacyId: string, itemLegacyId: string, quantity: number) {
  const result = await pool.query(
    `UPDATE cart_items ci SET quantity = $1, updated_at = now()
     FROM carts c, variants v
     WHERE ci.legacy_id = $2 AND ci.cart_id = c.id AND c.legacy_id = $3 AND ci.variant_id = v.id
       AND (v.availability_type = 'MADE_TO_ORDER' OR quantity <= v.stock)
     RETURNING ci.legacy_id`,
    [quantity, itemLegacyId, cartLegacyId]
  );
  if (!result.rowCount) throw new Error('Cart item not found or quantity exceeds stock');
  const cart = await getDbCart(cartLegacyId);
  return cart.items.find((item) => item.id === itemLegacyId)!;
}

export async function removeDbCartItem(cartLegacyId: string, itemLegacyId: string) {
  await pool.query(
    `DELETE FROM cart_items ci USING carts c WHERE ci.cart_id = c.id AND ci.legacy_id = $1 AND c.legacy_id = $2`,
    [itemLegacyId, cartLegacyId]
  );
}

export async function createDbOrder(cartLegacyId: string, paymentMethod: 'CASH_ON_DELIVERY' | 'WHATSAPP_TRANSFER', userLegacyId: string | null, customerPhone: string | null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
        const cart = await client.query<{ variantId: string; productName: string; quantity: number; price: number; variantUuid: string; productUuid: string; availabilityType: 'IMMEDIATE' | 'MADE_TO_ORDER' }>(
      `SELECT v.legacy_id AS "variantId", p.name AS "productName", ci.quantity, ci.unit_price_snapshot AS price,
          v.id AS "variantUuid", p.id AS "productUuid", v.availability_type AS "availabilityType"
       FROM cart_items ci JOIN carts c ON c.id = ci.cart_id JOIN variants v ON v.id = ci.variant_id JOIN products p ON p.id = v.product_id
       WHERE c.legacy_id = $1 AND p.is_active = true AND v.is_active = true FOR UPDATE OF v`,
      [cartLegacyId]
    );
    if (!cart.rowCount) throw new Error('Cart is empty');
    let subtotal = 0;
    for (const item of cart.rows) {
      if (item.quantity > 99) throw new Error('Invalid quantity');
      if (item.availabilityType === 'IMMEDIATE') {
        const stock = await client.query<{ stock: number }>('SELECT stock FROM variants WHERE id = $1 FOR UPDATE', [item.variantUuid]);
        if (Number(stock.rows[0].stock) < item.quantity) throw new Error(`Insufficient stock for ${item.productName}`);
        await client.query('UPDATE variants SET stock = stock - $1, updated_at = now() WHERE id = $2', [item.quantity, item.variantUuid]);
      }
      subtotal += Number(item.price) * item.quantity;
    }
    const shipping = subtotal > 0 ? 9990 : 0;
    const orderLegacyId = `order-${Date.now()}`;
    const order = await client.query<{ id: string }>(
      `INSERT INTO orders (legacy_id, user_id, customer_phone, status, payment_method, payment_status, total, shipping_cost)
      VALUES ($1, (SELECT id FROM users WHERE legacy_id = $2), $3, 'PENDIENTE', $4::payment_method, 'PENDIENTE', $5, $6) RETURNING id`,
      [orderLegacyId, userLegacyId, customerPhone, paymentMethod, subtotal + shipping, shipping]
    );
    for (const item of cart.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, product_id, quantity, unit_price_snapshot, subtotal)
         VALUES ($1, $2, $3, $4::integer, $5::numeric, $4::integer * $5::numeric)`,
        [order.rows[0].id, item.variantUuid, item.productUuid, item.quantity, item.price]
      );
    }
    await client.query('INSERT INTO payments (legacy_id, order_id, method, status) VALUES ($1, $2, $3::payment_method, \'PENDIENTE\')', [orderLegacyId, order.rows[0].id, paymentMethod]);
    await client.query('DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE legacy_id = $1)', [cartLegacyId]);
    await client.query('COMMIT');
    return { orderId: orderLegacyId, status: 'PENDIENTE', paymentStatus: 'PENDIENTE', paymentMethod, subtotal, shippingCost: shipping, total: Number((subtotal + shipping).toFixed(2)) };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listDbOrders(userLegacyId: string) {
  const result = await pool.query(
     `SELECT o.legacy_id AS id, o.status, o.payment_method AS "paymentMethod", o.payment_status AS "paymentStatus",
       o.total, o.shipping_cost AS "shippingCost", o.created_at AS "createdAt"
     FROM orders o LEFT JOIN users u ON u.id = o.user_id
     WHERE u.legacy_id = $1 ORDER BY o.created_at DESC`,
    [userLegacyId]
  );
  return result.rows.map((order) => ({ ...order, total: Number(order.total), shippingCost: Number(order.shippingCost), subtotal: Number(order.total) - Number(order.shippingCost) }));
}

export async function getDbOrder(orderLegacyId: string, userLegacyId: string) {
  const order = await pool.query(
     `SELECT o.legacy_id AS id, o.status, o.payment_method AS "paymentMethod", o.payment_status AS "paymentStatus",
       o.total, o.shipping_cost AS "shippingCost",
       o.created_at AS "createdAt"
     FROM orders o LEFT JOIN users u ON u.id = o.user_id
     WHERE o.legacy_id = $1 AND u.legacy_id = $2`,
    [orderLegacyId, userLegacyId]
  );
  if (!order.rowCount) return null;
  const items = await pool.query(
    `SELECT p.name AS "productName", oi.quantity, oi.unit_price_snapshot AS "unitPriceSnapshot", oi.subtotal
     FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id
     WHERE o.legacy_id = $1 ORDER BY oi.created_at`,
    [orderLegacyId]
  );
  return { ...order.rows[0], total: Number(order.rows[0].total), shippingCost: Number(order.rows[0].shippingCost), subtotal: Number(order.rows[0].total) - Number(order.rows[0].shippingCost), items: items.rows.map((item) => ({ ...item, unitPriceSnapshot: Number(item.unitPriceSnapshot), subtotal: Number(item.subtotal) })) };
}

export async function cancelDbOrder(orderLegacyId: string, userLegacyId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const order = await client.query<{ id: string; status: string }>(
      `SELECT o.id, o.status FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.legacy_id = $1 AND u.legacy_id = $2 FOR UPDATE`,
      [orderLegacyId, userLegacyId]
    );
    if (!order.rowCount) throw new Error('Order not found or access denied');
    if (!['PENDIENTE', 'EN_PREPARACION'].includes(order.rows[0].status)) throw new Error('Order cannot be cancelled in its current state');
    const items = await client.query<{ variantId: string; quantity: number }>('SELECT variant_id AS "variantId", quantity FROM order_items WHERE order_id = $1', [order.rows[0].id]);
    for (const item of items.rows) await client.query('UPDATE variants SET stock = stock + $1, updated_at = now() WHERE id = $2', [item.quantity, item.variantId]);
    await client.query("UPDATE orders SET status = 'CANCELADO', payment_status = 'CANCELADO', updated_at = now() WHERE id = $1", [order.rows[0].id]);
    await client.query("UPDATE payments SET status = 'CANCELADO' WHERE order_id = $1", [order.rows[0].id]);
    await client.query('COMMIT');
    return { orderId: orderLegacyId, status: 'CANCELADO', inventoryReintegrated: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function confirmDbPayment(orderLegacyId: string) {
  const result = await pool.query("UPDATE payments SET status = 'CONFIRMADO', confirmed_at = now() WHERE legacy_id = $1 AND status = 'PENDIENTE' RETURNING order_id", [orderLegacyId]);
  if (!result.rowCount) throw new Error('Payment already confirmed or not found');
  await pool.query("UPDATE orders SET payment_status = 'CONFIRMADO', updated_at = now() WHERE id = $1", [result.rows[0].order_id]);
  return { paymentStatus: 'CONFIRMADO', orderStatus: 'PENDIENTE' };
}

export async function advanceDbOrderStatus(orderLegacyId: string, nextStatus: string) {
  const allowed: Record<string, string[]> = { PENDIENTE: ['EN_PREPARACION', 'CANCELADO'], EN_PREPARACION: ['ENVIADO', 'CANCELADO'], ENVIADO: ['ENTREGADO'], ENTREGADO: [], CANCELADO: [] };
  const current = await pool.query<{ id: string; status: string }>('SELECT id, status FROM orders WHERE legacy_id = $1', [orderLegacyId]);
  if (!current.rowCount) throw new Error('Order not found');
  if (!allowed[current.rows[0].status]?.includes(nextStatus)) throw new Error('Invalid order status transition');
  await pool.query('UPDATE orders SET status = $1::order_status, updated_at = now() WHERE id = $2', [nextStatus, current.rows[0].id]);
  return { orderId: orderLegacyId, status: nextStatus };
}
