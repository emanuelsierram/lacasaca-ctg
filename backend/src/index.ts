import cors from 'cors';
import { createHash, randomBytes } from 'node:crypto';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { z } from 'zod';

import { initializeDatabase, loadState, pool, saveState } from './config/database';
import { orderService } from './services/order.service';
import { userService, type UserRecord } from './services/user.service';
import { addDbCartItem, advanceDbOrderStatus, cancelDbOrder, confirmDbPayment, createDbOrder, getDbCart, getDbOrder, listDbOrders, removeDbCartItem, updateDbCartItem } from './repositories/postgres.store';

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
  attributes: Record<string, string>;
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
  paymentStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  total: number;
  shippingCost: number;
  items: OrderItem[];
  createdAt: string;
};

const products: Product[] = [
  {
    id: 'prod-1',
    slug: 'barcelona-2024',
    name: 'Camiseta FC Barcelona 2024',
    description: 'Estandar para partido y entrenamiento.',
    category: 'ACTUALES',
    availabilityType: 'IMMEDIATE',
    isActive: true,
    featuredImage: 'https://images.example.com/barca.jpg',
    variants: [
      {
        id: 'var-1',
        sku: 'BAR-2024-M',
        attributes: { size: 'M', version: 'Home' },
        price: 129.99,
        stock: 12,
        isActive: true,
        availabilityType: 'IMMEDIATE'
      },
      {
        id: 'var-2',
        sku: 'BAR-2024-L',
        attributes: { size: 'L', version: 'Home' },
        price: 129.99,
        stock: 0,
        isActive: true,
        availabilityType: 'IMMEDIATE'
      }
    ]
  },
  {
    id: 'prod-2',
    slug: 'argentina-1986',
    name: 'Camiseta Argentina Retro 1986',
    description: 'Versión clásica de la selección.',
    category: 'RETROS',
    availabilityType: 'MADE_TO_ORDER',
    isActive: true,
    featuredImage: 'https://images.example.com/argentina.jpg',
    variants: [
      {
        id: 'var-3',
        sku: 'ARG-86-M',
        attributes: { size: 'M', version: 'Retro' },
        price: 149.0,
        stock: 4,
        isActive: true,
        availabilityType: 'MADE_TO_ORDER'
      }
    ]
  }
];

const carts: { id: string; items: CartItem[] }[] = [];
const orders: Order[] = [];
const users: UserRecord[] = [];
const adminUsers = new Set(['admin-1']);

const persistState = () => saveState({ products, carts, orders, users });

async function syncCatalogToDatabase() {
  for (const product of products) {
    const category = await pool.query<{ id: string }>(
      'SELECT id FROM categories WHERE name = $1',
      [product.category]
    );
    const categoryId = category.rows[0]?.id;
    if (!categoryId) continue;
    await pool.query(
      `INSERT INTO products (legacy_id, slug, name, description, category_id, availability_type, is_active, featured_image)
       VALUES ($1, $2, $3, $4, $5, $6::availability_type, $7, $8)
       ON CONFLICT (legacy_id) DO UPDATE SET slug = EXCLUDED.slug, name = EXCLUDED.name,
         description = EXCLUDED.description, category_id = EXCLUDED.category_id,
         availability_type = EXCLUDED.availability_type, is_active = EXCLUDED.is_active,
         featured_image = EXCLUDED.featured_image, updated_at = now()`,
      [product.id, product.slug, product.name, product.description, categoryId, product.availabilityType, product.isActive, product.featuredImage]
    );
    for (const variant of product.variants) {
      await pool.query(
        `INSERT INTO variants (legacy_id, product_id, sku, attributes, price, stock, is_active, availability_type)
         VALUES ($1, (SELECT id FROM products WHERE legacy_id = $2), $3, $4::jsonb, $5, $6, $7, $8::availability_type)
         ON CONFLICT (legacy_id) DO UPDATE SET product_id = EXCLUDED.product_id, sku = EXCLUDED.sku,
           attributes = EXCLUDED.attributes, price = EXCLUDED.price, stock = EXCLUDED.stock,
           is_active = EXCLUDED.is_active, availability_type = EXCLUDED.availability_type, updated_at = now()`,
        [variant.id, product.id, variant.sku, JSON.stringify(variant.attributes), variant.price, variant.stock, variant.isActive, variant.availabilityType]
      );
    }
  }
}

async function syncUsersToDatabase() {
  for (const user of users) {
    await pool.query(
      `INSERT INTO users (legacy_id, name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5::user_role, true)
       ON CONFLICT (legacy_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, is_active = true`,
      [user.id, user.name, user.email, user.passwordHash, user.role]
    );
  }
}

async function findUserByEmail(email: string) {
  const result = await pool.query<{ id: string; name: string; email: string; passwordHash: string; role: 'CUSTOMER' | 'ADMIN' }>(
    'SELECT legacy_id AS id, name, email, password_hash AS "passwordHash", role FROM users WHERE lower(email) = lower($1) AND is_active = true',
    [email.trim()]
  );
  return result.rows[0] ?? null;
}

async function listCatalogFromDatabase() {
  const result = await pool.query(`
    SELECT p.legacy_id AS id, p.name, p.slug, p.description, c.name AS category,
      p.availability_type AS "availabilityType", p.is_active AS "isActive", p.featured_image AS "featuredImage",
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

async function getCatalogProductFromDatabase(id: string) {
  const result = await pool.query(`
    SELECT p.legacy_id AS id, p.name, p.slug, p.description, c.name AS category,
      p.availability_type AS "availabilityType", p.is_active AS "isActive", p.featured_image AS "featuredImage",
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

const findVariant = (variantId: string) => {
  for (const product of products) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (variant) {
      return { product, variant };
    }
  }
  return null;
};

const isAdmin = (userId?: string | null) => !!userId && adminUsers.has(userId);

const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive().max(99)
});

const checkoutSchema = z.object({
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'WHATSAPP_TRANSFER']),
  guestCheckout: z.boolean().default(true),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6).optional()
  }).default({ name: 'Guest', email: 'guest@example.com' })
});

const authRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

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

  const { variantId, quantity } = parsed.data;
  const cartId = (req.headers['x-cart-id'] as string) || 'guest-cart';
  try {
    return res.status(201).json(await addDbCartItem(cartId, variantId, quantity));
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
  let createdGuestAccount: { id: string; name: string; email: string; role: 'CUSTOMER' } | undefined;
  if (!userId && parsed.data.guestCheckout) {
    if (await findUserByEmail(parsed.data.customer.email)) {
      return res.status(409).json({ message: 'Este email ya tiene una cuenta. Inicia sesión para asociar el pedido.' });
    }
    createdGuestAccount = userService.createGuestUser(users, {
      name: parsed.data.customer.name,
      email: parsed.data.customer.email
    });
    userId = createdGuestAccount.id;
    await syncUsersToDatabase();
    await persistState();
  }
  try {
    const result = await createDbOrder(cartId, parsed.data.paymentMethod, userId);
    return res.status(201).json({ ...result, account: createdGuestAccount });
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
      role: user.role
    });
  } catch (error) {
    return res.status(409).json({ message: error instanceof Error ? error.message : 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const parsed = authLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload' });
  }

  const match = await findUserByEmail(parsed.data.email);
  const session = match && userService.verifyPassword(parsed.data.password, match.passwordHash)
    ? { id: match.id, name: match.name, email: match.email, role: match.role }
    : null;
  if (!session) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role
  });
});

app.post('/api/auth/password-reset/request', async (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const user = await pool.query<{ id: string }>('SELECT id FROM users WHERE lower(email) = $1 AND is_active = true', [email]);
  const response: { message: string; resetToken?: string } = { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' };
  if (user.rowCount) {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await pool.query('UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [user.rows[0].id]);
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '30 minutes')`,
      [user.rows[0].id, tokenHash]
    );
    if (process.env.NODE_ENV !== 'production') response.resetToken = token;
  }
  return res.json(response);
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

app.post('/api/admin/payments/:id/confirm', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!isAdmin(userId)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    return res.json(await confirmDbPayment(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id));
  } catch (error) {
    return res.status(409).json({ message: error instanceof Error ? error.message : 'Payment confirmation failed' });
  }
});

app.get('/api/admin/catalog/products', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!isAdmin(userId)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return res.json({ items: await listCatalogFromDatabase() });
});

app.patch('/api/admin/catalog/variants/:id', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!isAdmin(userId)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  const variantId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const found = findVariant(variantId);
  if (!found) {
    return res.status(404).json({ message: 'Variant not found' });
  }
  const { price, stock, isActive } = req.body as { price?: unknown; stock?: unknown; isActive?: unknown };
  if (price !== undefined && (typeof price !== 'number' || !Number.isFinite(price) || price < 0)) {
    return res.status(400).json({ message: 'Price must be a non-negative number' });
  }
  if (stock !== undefined && (!Number.isInteger(stock) || (stock as number) < 0)) {
    return res.status(400).json({ message: 'Stock must be a non-negative integer' });
  }
  if (price !== undefined) found.variant.price = price as number;
  if (stock !== undefined) found.variant.stock = stock as number;
  if (isActive !== undefined) found.variant.isActive = Boolean(isActive);
  await pool.query(
    `UPDATE variants SET price = COALESCE($1, price), stock = COALESCE($2, stock),
       is_active = COALESCE($3, is_active), updated_at = now() WHERE legacy_id = $4`,
    [price ?? null, stock ?? null, isActive ?? null, variantId]
  );
  await persistState();
  return res.json(found.variant);
});

app.patch('/api/admin/orders/:id/status', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!isAdmin(userId)) {
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
  const state = await loadState({ products: [], carts: [], orders: [], users: [] });
  if (state.products.length > 0) products.splice(0, products.length, ...state.products);
  if (state.carts.length > 0) carts.splice(0, carts.length, ...state.carts);
  if (state.orders.length > 0) orders.splice(0, orders.length, ...state.orders);
  if (state.users.length > 0) users.splice(0, users.length, ...state.users);
  if (state.products.length === 0) await persistState();
  await syncCatalogToDatabase();
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
