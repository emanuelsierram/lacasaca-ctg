import cors from 'cors';
import { createHash, randomBytes } from 'node:crypto';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { z } from 'zod';

import { initializeDatabase, loadState, pool, saveState } from './config/database';
import { orderService } from './services/order.service';
import { passwordResetService } from './services/password-reset.service';
import { userService, type UserRecord } from './services/user.service';
import { addDbCartItem, advanceDbOrderStatus, cancelDbAdminOrder, cancelDbOrder, confirmDbPayment, createDbAdminOrder, createDbOrder, createDbPayment, getDbCart, getDbOrder, listDbOrders, listDbPayments, removeDbCartItem, updateDbAdminOrder, updateDbCartItem, updateDbPaymentStatus } from './repositories/postgres.store';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

const categoryEnum = ['RETROS', 'ACTUALES', 'SELECCIONES', 'FEMENINO', 'NINOS'] as const;
type Category = (typeof categoryEnum)[number];

type Variant = {
  id: string;
  sku: string;
  attributes: Record<string, string | boolean>;
  price: number;
  stock: number;
  isActive: boolean;
  availabilityType: 'IMMEDIATE' | 'MADE_TO_ORDER';
};

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: Category;
  availabilityType: 'IMMEDIATE' | 'MADE_TO_ORDER';
  isActive: boolean;
  featuredImage: string;
  images: string[];
  variants: Variant[];
};

type CartItem = {
  id: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

type OrderItem = {
  id: string;
  variantId: string;
  productName: string;
  quantity: number;
  unitPriceSnapshot: number;
  subtotal: number;
};

type Order = {
  id: string;
  userId: string | null;
  status: 'PENDIENTE' | 'EN_PREPARACION' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  paymentMethod: 'CASH_ON_DELIVERY' | 'WHATSAPP_TRANSFER';
  paymentStatus: 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' | 'EXPIRADO' | 'CANCELADO';
  total: number;
  shippingCost: number;
  items: OrderItem[];
  createdAt: string;
};

const carts: { id: string; items: CartItem[] }[] = [];
const orders: Order[] = [];
const users: UserRecord[] = [];
const adminUsers = new Set(['admin-1']);

const persistState = () => saveState({ carts, orders, users });

async function syncUsersToDatabase() {
  for (const user of users) {
    await pool.query(
      `INSERT INTO users (legacy_id, name, email, address, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6::user_role, true)
       ON CONFLICT (legacy_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email,
         address = EXCLUDED.address, password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role, is_active = true`,
      [user.id, user.name, user.email, user.address ?? '', user.passwordHash, user.role]
    );
  }
}

async function findUserByEmail(email: string) {
  const result = await pool.query<{ id: string; name: string; email: string; address: string; passwordHash: string; role: 'CUSTOMER' | 'ADMIN' }>(
    'SELECT legacy_id AS id, name, email, address, password_hash AS "passwordHash", role FROM users WHERE lower(email) = lower($1) AND is_active = true',
    [email.trim()]
  );
  return result.rows[0] ?? null;
}

async function updateUserAddress(userLegacyId: string, address: string) {
  await pool.query('UPDATE users SET address = $1 WHERE legacy_id = $2', [address.trim(), userLegacyId]);
}

async function listCatalogFromDatabase() {
  const result = await pool.query(`
    SELECT p.legacy_id AS id, p.name, p.slug, p.description, c.name AS category,
      p.availability_type AS "availabilityType", p.is_active AS "isActive",
      COALESCE((SELECT jsonb_agg(pi.image_url ORDER BY pi.sort_order, pi.created_at)
        FROM product_images pi WHERE pi.product_id = p.id AND pi.is_active = true), '[]'::jsonb) AS images,
      COALESCE(jsonb_agg(jsonb_build_object('id', v.legacy_id, 'sku', v.sku, 'attributes', v.attributes,
        'price', v.price, 'stock', v.stock, 'isActive', v.is_active, 'availabilityType', v.availability_type)
        ORDER BY v.created_at) FILTER (WHERE v.legacy_id IS NOT NULL), '[]'::jsonb) AS variants
    FROM products p JOIN categories c ON c.id = p.category_id
    LEFT JOIN variants v ON v.product_id = p.id
    WHERE p.is_active = true
    GROUP BY p.id, c.name
    ORDER BY p.created_at
  `);
  return result.rows;
}

async function listAdminCatalogFromDatabase(category?: string, availabilityType?: string, search = '') {
  const result = await pool.query(`
    SELECT p.legacy_id AS id, p.name, p.slug, p.description, c.name AS category,
      p.availability_type AS "availabilityType", p.is_active AS "isActive",
      COALESCE((SELECT jsonb_agg(pi.image_url ORDER BY pi.sort_order, pi.created_at)
        FROM product_images pi WHERE pi.product_id = p.id AND pi.is_active = true), '[]'::jsonb) AS images,
      COALESCE(jsonb_agg(jsonb_build_object('id', v.legacy_id, 'sku', v.sku, 'attributes', v.attributes,
        'price', v.price, 'stock', v.stock, 'isActive', v.is_active, 'availabilityType', v.availability_type)
        ORDER BY v.created_at) FILTER (WHERE v.legacy_id IS NOT NULL), '[]'::jsonb) AS variants
    FROM products p JOIN categories c ON c.id = p.category_id
    LEFT JOIN variants v ON v.product_id = p.id
    WHERE ($1::text IS NULL OR c.name::text = $1)
      AND ($2::text IS NULL OR p.availability_type::text = $2)
      AND ($3 = '' OR lower(p.name) LIKE '%' || lower($3) || '%')
    GROUP BY p.id, c.name ORDER BY p.created_at DESC
  `, [category ?? null, availabilityType ?? null, search]);
  return result.rows;
}

async function getCatalogProductFromDatabase(id: string) {
  const result = await pool.query(`
    SELECT p.legacy_id AS id, p.name, p.slug, p.description, c.name AS category,
      p.availability_type AS "availabilityType", p.is_active AS "isActive",
      COALESCE((SELECT jsonb_agg(pi.image_url ORDER BY pi.sort_order, pi.created_at)
        FROM product_images pi WHERE pi.product_id = p.id AND pi.is_active = true), '[]'::jsonb) AS images,
      COALESCE(jsonb_agg(jsonb_build_object('id', v.legacy_id, 'sku', v.sku, 'attributes', v.attributes,
        'price', v.price, 'stock', v.stock, 'isActive', v.is_active, 'availabilityType', v.availability_type)
        ORDER BY v.created_at) FILTER (WHERE v.legacy_id IS NOT NULL), '[]'::jsonb) AS variants
    FROM products p JOIN categories c ON c.id = p.category_id
    LEFT JOIN variants v ON v.product_id = p.id
    WHERE p.is_active = true AND p.legacy_id = $1
    GROUP BY p.id, c.name
  `, [id]);
  return result.rows[0] ?? null;
}

const safeProduct = (product: Product) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  category: product.category,
  availabilityType: product.availabilityType,
  isActive: product.isActive,
  featuredImage: product.featuredImage,
  variants: product.variants
    .filter((variant) => variant.isActive)
    .map(({ id, sku, attributes, price, stock, isActive }) => ({
      id,
      sku,
      attributes,
      price,
      stock,
      isActive
    }))
});

const getCart = (cartId: string) => carts.find((cart) => cart.id === cartId) ?? { id: cartId, items: [] };

async function findVariant(variantId: string) {
  const result = await pool.query<{
    id: string;
    sku: string;
    attributes: Record<string, string | boolean>;
    price: number;
    stock: number;
    isActive: boolean;
  }>(
    `SELECT legacy_id AS id, sku, attributes, price, stock, is_active AS "isActive"
     FROM variants WHERE legacy_id = $1`,
    [variantId]
  );
  return result.rows[0] ?? null;
}

async function isAdmin(userId?: string | null) {
  if (!userId) return false;
  if (adminUsers.has(userId)) return true;
  const result = await pool.query<{ role: 'CUSTOMER' | 'ADMIN' }>(
    'SELECT role FROM users WHERE legacy_id = $1 AND is_active = true',
    [userId]
  );
  return result.rows[0]?.role === 'ADMIN';
}

const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive().max(99),
  attributes: z.record(z.union([z.string(), z.boolean()])).optional()
});

const checkoutSchema = z.object({
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'WHATSAPP_TRANSFER']),
  guestCheckout: z.boolean().default(true),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().trim().min(6, 'Phone is required'),
    address: z.string().trim().min(5, 'Address is required')
  }).default({ name: 'Guest', email: 'guest@example.com', phone: '', address: '' })
});

const authRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const passwordSchema = z.string().regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, 'Password does not meet strength requirements');

app.get('/', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'lacasaca-backend',
    message: 'API root. Use /api/health or /api/* endpoints.'
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'lacasaca-backend' });
});

app.get('/api/catalog/products', async (req: Request, res: Response) => {
  const category = typeof req.query.category === 'string' ? req.query.category.toUpperCase() : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : '';

  const catalog = await listCatalogFromDatabase();
  const filtered = catalog.filter((product) => {
    const matchesCategory = !category || product.category === category;
    const matchesSearch = !search || product.name.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  res.json({
    items: filtered,
    total: filtered.length
  });
});

app.get('/api/catalog/products/:id', async (req: Request, res: Response) => {
  const product = await getCatalogProductFromDatabase(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json(product);
});

app.get('/api/cart', async (req: Request, res: Response) => {
  const cartId = (req.headers['x-cart-id'] as string) || 'guest-cart';
  return res.json(await getDbCart(cartId));
});

app.post('/api/cart/items', async (req: Request, res: Response) => {
  const parsed = cartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid cart item payload' });
  }

  const { variantId, quantity, attributes } = parsed.data;
  const cartId = (req.headers['x-cart-id'] as string) || 'guest-cart';
  try {
    return res.status(201).json(await addDbCartItem(cartId, variantId, quantity, attributes));
  } catch (error) {
    return res.status(error instanceof Error && error.message === 'Variant not found' ? 404 : 422).json({ message: error instanceof Error ? error.message : 'Unable to add cart item' });
  }
});

app.patch('/api/cart/items/:id', async (req: Request, res: Response) => {
  const cartId = (req.headers['x-cart-id'] as string) || 'guest-cart';
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive integer' });
  }

  try {
    const itemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    return res.json(await updateDbCartItem(cartId, itemId, quantity));
  } catch (error) {
    return res.status(422).json({ message: error instanceof Error ? error.message : 'Unable to update cart item' });
  }
});

app.delete('/api/cart/items/:id', async (req: Request, res: Response) => {
  const cartId = (req.headers['x-cart-id'] as string) || 'guest-cart';
  const itemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await removeDbCartItem(cartId, itemId);
  return res.status(204).send();
});

app.post('/api/checkout', async (req: Request, res: Response) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid checkout payload' });
  }

  const cartId = (req.headers['x-cart-id'] as string) || 'guest-cart';
  let userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  let createdGuestAccount: { id: string; name: string; email: string; address: string; role: 'CUSTOMER' } | undefined;
  if (!userId && parsed.data.guestCheckout) {
    if (await findUserByEmail(parsed.data.customer.email)) {
      return res.status(409).json({ message: 'Este email ya tiene una cuenta. Inicia sesión para asociar el pedido.' });
    }
    const guestAccount = userService.createGuestUser(users, {
      name: parsed.data.customer.name,
      email: parsed.data.customer.email
    });
    guestAccount.address = parsed.data.customer.address;
    createdGuestAccount = guestAccount;
    userId = guestAccount.id;
    await syncUsersToDatabase();
    await persistState();
  }
  try {
    await updateUserAddress(userId as string, parsed.data.customer.address);
    const result = await createDbOrder(cartId, parsed.data.paymentMethod, userId, parsed.data.customer.phone ?? null);
    return res.status(201).json({ ...result, account: createdGuestAccount ? { ...createdGuestAccount, mustChangePassword: true } : undefined });
  } catch (error) {
    return res.status(422).json({ message: error instanceof Error ? error.message : 'Unable to create order' });
  }

});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const parsed = authRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid registration payload' });
  }

  try {
    const user = userService.registerUser(users, parsed.data);
    await syncUsersToDatabase();
    await persistState();
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role
    });
  } catch (error) {
    return res.status(409).json({ message: error instanceof Error ? error.message : 'Registration failed' });
  }
});

app.post('/api/auth/password', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  const parsed = passwordSchema.safeParse(req.body.password);
  if (!userId || !parsed.success) {
    return res.status(400).json({ message: 'Authentication and a valid password are required' });
  }
  const updated = await pool.query('UPDATE users SET password_hash = $1 WHERE legacy_id = $2 AND is_active = true', [userService.hashPassword(parsed.data), userId]);
  if (!updated.rowCount) return res.status(404).json({ message: 'User not found' });
  return res.json({ message: 'Contraseña creada correctamente' });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const parsed = authLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload' });
  }

  const match = await findUserByEmail(parsed.data.email);
  const session = match && userService.verifyPassword(parsed.data.password, match.passwordHash)
    ? { id: match.id, name: match.name, email: match.email, address: match.address, role: match.role }
    : null;
  if (!session) {
    return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
  }

  return res.json({
    id: session.id,
    name: session.name,
    email: session.email,
    address: session.address,
    role: session.role
  });
});

app.post('/api/auth/password-reset/request', async (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query<{ id: string }>('SELECT id FROM users WHERE lower(email) = $1 AND is_active = true', [email]);
    if (!user.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'El correo no existe' });
    }

    await client.query(
      `INSERT INTO password_reset_rate_limits (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.rows[0].id]
    );
    const rateLimit = await client.query<{ attempts: number; lastRequestedAt: Date | null; blockedUntil: Date | null; windowStartedAt: Date }>(
      `SELECT attempts, last_requested_at AS "lastRequestedAt", blocked_until AS "blockedUntil", window_started_at AS "windowStartedAt"
       FROM password_reset_rate_limits WHERE user_id = $1 FOR UPDATE`,
      [user.rows[0].id]
    );
    const current = rateLimit.rows[0];
    const now = Date.now();
    const blockedUntil = current.blockedUntil?.getTime() ?? 0;
    if (blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((blockedUntil - now) / 1000);
      await client.query('ROLLBACK');
      return res.status(429).json({ message: `Has alcanzado el límite de recuperación. Espera ${Math.ceil(retryAfterSeconds / 60)} minutos para volver a intentarlo.`, retryAfterSeconds });
    }
    const windowExpired = now - current.windowStartedAt.getTime() >= 30 * 60 * 1000;
    const attempts = windowExpired ? 0 : current.attempts;
    if (!windowExpired && current.lastRequestedAt) {
      const retryAfterSeconds = Math.ceil((current.lastRequestedAt.getTime() + 60 * 1000 - now) / 1000);
      if (retryAfterSeconds > 0) {
        await client.query('ROLLBACK');
        return res.status(429).json({ message: `Espera ${retryAfterSeconds} segundos antes de solicitar otro correo.`, retryAfterSeconds });
      }
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await client.query('UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [user.rows[0].id]);
    await client.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '30 minutes')`,
      [user.rows[0].id, tokenHash]
    );
    await passwordResetService.sendResetEmail(email, token);

    const nextAttempts = attempts + 1;
    const nextBlockedUntil = nextAttempts >= 3 ? 'now() + interval \'30 minutes\'' : 'NULL';
    await client.query(
      `UPDATE password_reset_rate_limits
       SET window_started_at = CASE WHEN $2 THEN now() ELSE window_started_at END,
           attempts = $3,
           last_requested_at = now(),
           blocked_until = ${nextBlockedUntil},
           updated_at = now()
       WHERE user_id = $1`,
      [user.rows[0].id, windowExpired, nextAttempts]
    );
    await client.query('COMMIT');

    return res.json({
      message: 'Las instrucciones para restablecer tu contraseña fueron enviadas a tu correo.',
      retryAfterSeconds: nextAttempts >= 3 ? 30 * 60 : 60
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

app.post('/api/auth/password-reset/confirm', async (req: Request, res: Response) => {
  const token = typeof req.body.token === 'string' ? req.body.token : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!token || !password || !/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
    return res.status(400).json({ message: 'Token y contraseña válida son obligatorios' });
  }
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const reset = await pool.query<{ id: string; userId: string }>(
    `SELECT id, user_id AS "userId" FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  if (!reset.rowCount) return res.status(400).json({ message: 'El token es inválido o expiró' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [userService.hashPassword(password), reset.rows[0].userId]);
    await client.query('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [reset.rows[0].id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return res.json({ message: 'Contraseña actualizada correctamente' });
});

app.get('/api/orders/me', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  return res.json({ items: await listDbOrders(userId) });
});

app.get('/api/orders/:id', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const order = userId ? await getDbOrder(orderId, userId) : null;

  if (!order) {
    return res.status(403).json({ message: 'Order not found or access denied' });
  }

  return res.json({
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    items: order.items,
    total: order.total,
    createdAt: order.createdAt
  });
});

app.post('/api/orders/:id/cancel', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!userId) return res.status(401).json({ message: 'Authentication required' });
  try {
    return res.json(await cancelDbOrder(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, userId));
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to cancel order' });
  }
});

app.get('/api/admin/catalog/products', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const category = typeof req.query.category === 'string' && req.query.category !== 'ALL' ? req.query.category.toUpperCase() : undefined;
  const availabilityType = typeof req.query.availabilityType === 'string' && req.query.availabilityType !== 'ALL' ? req.query.availabilityType.toUpperCase() : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  return res.json({ items: await listAdminCatalogFromDatabase(category, availabilityType, search) });
});

app.post('/api/admin/catalog/products', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const { name, slug, description, category, availabilityType, variants = [] } = req.body as Record<string, any>;
  if (!name || !slug || !description || !category || !availabilityType || !Array.isArray(variants)) {
    return res.status(400).json({ message: 'Product name, slug, description, category, availability and variants are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const productId = `prod-${Date.now()}`;
    const product = await client.query<{ id: string }>(
      `INSERT INTO products (legacy_id, slug, name, description, category_id, availability_type)
       VALUES ($1, $2, $3, $4, (SELECT id FROM categories WHERE name = $5::product_category), $6::availability_type) RETURNING id`,
      [productId, slug, name, description, category, availabilityType]
    );
    for (const [index, variant] of variants.entries()) {
      await client.query(
        `INSERT INTO variants (legacy_id, product_id, sku, attributes, price, stock, is_active, availability_type)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::availability_type)`,
        [variant.id ?? `var-${Date.now()}-${index}`, product.rows[0].id, variant.sku?.trim() || `SKU-${productId}-${index}`, JSON.stringify(variant.attributes ?? {}), Number(variant.price), Number(variant.stock ?? 0), variant.isActive !== false, availabilityType]
      );
    }
    await client.query('COMMIT');
    return res.status(201).json({ id: productId });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to create product' });
  } finally {
    client.release();
  }
});

app.patch('/api/admin/catalog/products/:id', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, slug, description, category, availabilityType, isActive } = req.body as Record<string, any>;
  const result = await pool.query(
    `UPDATE products SET name = COALESCE($1, name), slug = COALESCE($2, slug), description = COALESCE($3, description),
      category_id = COALESCE((SELECT id FROM categories WHERE name = $4::product_category), category_id),
      availability_type = COALESCE($5::availability_type, availability_type),
      is_active = COALESCE($6, is_active), updated_at = now() WHERE legacy_id = $7`,
    [name ?? null, slug ?? null, description ?? null, category ?? null, availabilityType ?? null, isActive ?? null, productId]
  );
  if (!result.rowCount) return res.status(404).json({ message: 'Product not found' });
  return res.json({ id: productId });
});

app.delete('/api/admin/catalog/products/:id', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await pool.query('UPDATE products SET is_active = false, updated_at = now() WHERE legacy_id = $1', [productId]);
  await pool.query('UPDATE variants SET is_active = false, updated_at = now() WHERE product_id = (SELECT id FROM products WHERE legacy_id = $1)', [productId]);
  if (!result.rowCount) return res.status(404).json({ message: 'Product not found' });
  return res.status(204).send();
});

app.post('/api/admin/catalog/products/:id/variants', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { sku, attributes = {}, price, stock = 0, isActive = true } = req.body as Record<string, any>;
  if (!sku || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0) return res.status(400).json({ message: 'Invalid variant data' });
  const id = `var-${Date.now()}`;
  const result = await pool.query<{ id: string }>(
    `INSERT INTO variants (legacy_id, product_id, sku, attributes, price, stock, is_active, availability_type)
     SELECT $1, p.id, $2, $3::jsonb, $4, $5, $6, p.availability_type FROM products p WHERE p.legacy_id = $7 RETURNING legacy_id AS id`,
    [id, sku, JSON.stringify(attributes), Number(price), Number(stock), isActive, productId]
  );
  if (!result.rowCount) return res.status(404).json({ message: 'Product not found' });
  return res.status(201).json({ id });
});

app.delete('/api/admin/catalog/variants/:id', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const variantId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await pool.query('UPDATE variants SET is_active = false, updated_at = now() WHERE legacy_id = $1', [variantId]);
  if (!result.rowCount) return res.status(404).json({ message: 'Variant not found' });
  return res.status(204).send();
});

app.get('/api/admin/users', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const result = await pool.query('SELECT legacy_id AS id, name, email, address, role, is_active AS "isActive" FROM users ORDER BY created_at DESC');
  return res.json({ items: result.rows });
});

app.post('/api/admin/users', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const { name, email, password, address = '', role = 'CUSTOMER' } = req.body as Record<string, any>;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  try {
    const created = userService.registerUser(users, { name, email, password });
    const createdRecord = users.find((user) => user.id === created.id);
    if (createdRecord) {
      createdRecord.address = address;
      createdRecord.role = role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
    }
    await syncUsersToDatabase();
    await persistState();
    return res.status(201).json({ id: created.id });
  } catch (error) {
    return res.status(409).json({ message: error instanceof Error ? error.message : 'Unable to create user' });
  }
});

app.patch('/api/admin/users/:id', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, email, address, role, isActive } = req.body as Record<string, any>;
  const result = await pool.query(
    `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), address = COALESCE($3, address),
      role = COALESCE($4::user_role, role), is_active = COALESCE($5, is_active) WHERE legacy_id = $6`,
    [name ?? null, email ?? null, address ?? null, role ?? null, isActive ?? null, targetId]
  );
  if (!result.rowCount) return res.status(404).json({ message: 'User not found' });
  return res.json({ id: targetId });
});

app.delete('/api/admin/users/:id', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (targetId === userId) return res.status(400).json({ message: 'You cannot deactivate your own account' });
  const result = await pool.query('UPDATE users SET is_active = false WHERE legacy_id = $1', [targetId]);
  if (!result.rowCount) return res.status(404).json({ message: 'User not found' });
  return res.status(204).send();
});

app.get('/api/admin/orders', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const result = await pool.query(`
    SELECT o.legacy_id AS id, o.status, o.payment_method AS "paymentMethod", o.payment_status AS "paymentStatus",
      o.total, o.shipping_cost AS "shippingCost", o.customer_phone AS "customerPhone", o.created_at AS "createdAt",
      u.legacy_id AS "userId", u.name AS "userName", u.email
    FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC`);
  return res.json({ items: result.rows.map((order) => ({ ...order, total: Number(order.total), shippingCost: Number(order.shippingCost), subtotal: Number(order.total) - Number(order.shippingCost) })) });
});

app.post('/api/admin/orders', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const { userLegacyId, customerPhone, notes, total, paymentMethod, items = [] } = req.body as { userLegacyId?: string; customerPhone?: string; notes?: string; total?: number; paymentMethod?: 'CASH_ON_DELIVERY' | 'WHATSAPP_TRANSFER'; items?: Array<{ variantId: string; quantity: number }> };
  if (!paymentMethod || !Array.isArray(items)) return res.status(400).json({ message: 'Payment method and items are required' });
  try { return res.status(201).json(await createDbAdminOrder({ userLegacyId, customerPhone, notes, total, paymentMethod, items })); }
  catch (error) { return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to create order' }); }
});

app.patch('/api/admin/orders/:id', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  try { return res.json(await updateDbAdminOrder(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, req.body)); }
  catch (error) { return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to edit order' }); }
});

app.delete('/api/admin/orders/:id', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  try { return res.json(await cancelDbAdminOrder(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)); }
  catch (error) { return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to cancel order' }); }
});

app.post('/api/admin/payments/:id/confirm', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    return res.json(await confirmDbPayment(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id));
  } catch (error) {
    return res.status(409).json({ message: error instanceof Error ? error.message : 'Payment confirmation failed' });
  }
});

app.get('/api/admin/payments', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  return res.json({ items: await listDbPayments() });
});

app.patch('/api/admin/payments/:id/status', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) return res.status(403).json({ message: 'Admin access required' });
  const status = typeof req.body.status === 'string' ? req.body.status : '';
  try {
    return res.json(await updateDbPaymentStatus(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, status));
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to update payment' });
  }
});

app.patch('/api/admin/catalog/variants/:id', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  const variantId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { price, stock, isActive } = req.body as { price?: unknown; stock?: unknown; isActive?: unknown };
  if (price !== undefined && (typeof price !== 'number' || !Number.isFinite(price) || price < 0)) {
    return res.status(400).json({ message: 'Price must be a non-negative number' });
  }
  if (stock !== undefined && (!Number.isInteger(stock) || (stock as number) < 0)) {
    return res.status(400).json({ message: 'Stock must be a non-negative integer' });
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive must be a boolean' });
  }
  if (price === undefined && stock === undefined && isActive === undefined) {
    return res.status(400).json({ message: 'At least one variant field is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const selected = await client.query<{ productId: string }>(
      'SELECT product_id AS "productId" FROM variants WHERE legacy_id = $1 FOR UPDATE',
      [variantId]
    );
    const productId = selected.rows[0]?.productId;
    if (!productId) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Variant not found' });
    }

    const values: unknown[] = [];
    const changes: string[] = [];
    if (price !== undefined) {
      values.push(price);
      changes.push(`price = $${values.length}`);
    }
    if (stock !== undefined) {
      values.push(stock);
      changes.push(`stock = $${values.length}`);
    }
    if (isActive !== undefined) {
      values.push(isActive);
      changes.push(`is_active = $${values.length}`);
    }
    values.push(variantId);
    const updated = await client.query(
      `UPDATE variants SET ${changes.join(', ')}, updated_at = now() WHERE legacy_id = $${values.length}`,
      values
    );
    if (!updated.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Variant not found' });
    }

    if (isActive !== undefined) {
      await client.query(
        `UPDATE products SET is_active = EXISTS (
           SELECT 1 FROM variants WHERE product_id = $1 AND is_active = true
         ), updated_at = now() WHERE id = $1`,
        [productId]
      );
    }
    await client.query('COMMIT');
    return res.json(await findVariant(variantId));
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to update variant' });
  } finally {
    client.release();
  }
});

app.patch('/api/admin/orders/:id/status', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!(await isAdmin(userId))) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const nextStatus = req.body.status as
    | 'PENDIENTE'
    | 'EN_PREPARACION'
    | 'ENVIADO'
    | 'ENTREGADO'
    | 'CANCELADO';
  const allowed: Record<string, Array<'PENDIENTE' | 'EN_PREPARACION' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'>> = {
    PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
    EN_PREPARACION: ['ENVIADO', 'CANCELADO'],
    ENVIADO: ['ENTREGADO'],
    ENTREGADO: [],
    CANCELADO: []
  };

  try {
    return res.json(await advanceDbOrderStatus(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, nextStatus));
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid order status transition' });
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: () => void) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

async function start() {
  await initializeDatabase();
  const state = await loadState({ carts: [], orders: [], users: [] });
  if (state.carts.length > 0) carts.splice(0, carts.length, ...state.carts);
  if (state.orders.length > 0) orders.splice(0, orders.length, ...state.orders);
  if (state.users.length > 0) users.splice(0, users.length, ...state.users);
  await syncUsersToDatabase();
  app.listen(port, () => {
    console.log(`Lacasaca backend listening on http://localhost:${port}`);
    console.log('PostgreSQL persistence enabled');
  });
}

start().catch((error) => {
  if (error instanceof Error && 'code' in error && error.code === '28P01') {
    console.error('No se pudo autenticar PostgreSQL. Revisa PGUSER y PGPASSWORD en backend/.env.');
  } else {
    console.error('No se pudo inicializar la persistencia PostgreSQL:', error instanceof Error ? error.message : 'Error desconocido');
  }
  process.exit(1);
});
