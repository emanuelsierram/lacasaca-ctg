import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { z } from 'zod';

import { orderService } from './services/order.service';
import { userService, type UserRecord } from './services/user.service';

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

app.get('/api/catalog/products', (req: Request, res: Response) => {
  const category = typeof req.query.category === 'string' ? req.query.category.toUpperCase() : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : '';

  const filtered = products.filter((product) => {
    const matchesCategory = !category || product.category === category;
    const matchesSearch = !search || product.name.toLowerCase().includes(search);
    return product.isActive && matchesCategory && matchesSearch;
  });

  res.json({
    items: filtered.map(safeProduct),
    total: filtered.length
  });
});

app.get('/api/catalog/products/:id', (req: Request, res: Response) => {
  const product = products.find((item) => item.id === req.params.id && item.isActive);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json(safeProduct(product));
});

app.get('/api/cart', (req: Request, res: Response) => {
  const cartId = (req.headers['x-cart-id'] as string) || 'guest-cart';
  const cart = getCart(cartId);
  const total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);

  res.json({
    id: cart.id,
    items: cart.items,
    total
  });
});

app.post('/api/cart/items', (req: Request, res: Response) => {
  const parsed = cartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid cart item payload' });
  }

  const { variantId, quantity } = parsed.data;
  const cartId = (req.headers['x-cart-id'] as string) || 'guest-cart';
  let cart = getCart(cartId);

  const found = findVariant(variantId);
  if (!found) {
    return res.status(404).json({ message: 'Variant not found' });
  }

  if (!found.variant.isActive) {
    return res.status(422).json({ message: 'Variant is not active' });
  }

  const existing = cart.items.find((item) => item.variantId === variantId);
  const newQuantity = (existing?.quantity ?? 0) + quantity;

  const subtotal = found.variant.price * newQuantity;
  const item: CartItem = {
    id: existing?.id ?? `cart-item-${Date.now()}`,
    variantId,
    productName: found.product.name,
    variantLabel: `${found.variant.attributes.size ?? 'Standard'} - ${found.variant.attributes.version ?? 'Base'}`,
    unitPrice: found.variant.price,
    quantity: newQuantity,
    subtotal
  };

  cart.items = cart.items.filter((entry) => entry.variantId !== variantId);
  cart.items.push(item);

  if (!carts.some((entry) => entry.id === cartId)) {
    carts.push(cart);
  } else {
    const idx = carts.findIndex((entry) => entry.id === cartId);
    carts[idx] = cart;
  }

  return res.status(201).json(item);
});

app.patch('/api/cart/items/:id', (req: Request, res: Response) => {
  const cartId = (req.headers['x-cart-id'] as string) || 'guest-cart';
  const cart = getCart(cartId);
  const target = cart.items.find((item) => item.id === req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Cart item not found' });
  }

  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive integer' });
  }

  const variant = findVariant(target.variantId)?.variant;
  if (!variant) {
    return res.status(404).json({ message: 'Variant not found' });
  }

  if (quantity > variant.stock) {
    return res.status(422).json({ message: 'Requested quantity exceeds available stock' });
  }

  target.quantity = quantity;
  target.subtotal = target.unitPrice * quantity;

  return res.json(target);
});

app.delete('/api/cart/items/:id', (req: Request, res: Response) => {
  const cartId = (req.headers['x-cart-id'] as string) || 'guest-cart';
  const cart = getCart(cartId);
  const nextItems = cart.items.filter((item) => item.id !== req.params.id);
  cart.items = nextItems;
  return res.status(204).send();
});

app.post('/api/checkout', (req: Request, res: Response) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid checkout payload' });
  }

  const cartId = (req.headers['x-cart-id'] as string) || 'guest-cart';
  const cart = getCart(cartId);
  if (cart.items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  let total = 0;
  const orderItems: OrderItem[] = [];

  for (const item of cart.items) {
    const found = findVariant(item.variantId);
    if (!found) {
      return res.status(422).json({ message: `Variant ${item.variantId} is unavailable` });
    }

    if (!found.variant.isActive || found.variant.stock < item.quantity) {
      return res.status(422).json({ message: `Insufficient stock for ${found.product.name}` });
    }

    const subtotal = item.unitPrice * item.quantity;
    total += subtotal;
    orderItems.push({
      id: `order-item-${Date.now()}-${item.variantId}`,
      variantId: item.variantId,
      productName: found.product.name,
      quantity: item.quantity,
      unitPriceSnapshot: item.unitPrice,
      subtotal
    });
  }

  const shippingCost = total > 0 ? 9.99 : 0;
  const order: Order = {
    id: `order-${Date.now()}`,
    userId: (req.headers['x-user-id'] as string | undefined) ?? null,
    status: 'PENDIENTE',
    paymentMethod: parsed.data.paymentMethod,
    paymentStatus: 'PENDING',
    total: total + shippingCost,
    shippingCost,
    items: orderItems,
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  cart.items = [];

  for (const item of orderItems) {
    const found = findVariant(item.variantId);
    if (found) {
      found.variant.stock -= item.quantity;
    }
  }

  return res.status(201).json({
    orderId: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const parsed = authRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid registration payload' });
  }

  try {
    const user = userService.registerUser(users, parsed.data);
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

app.post('/api/auth/login', (req: Request, res: Response) => {
  const parsed = authLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload' });
  }

  const session = userService.loginUser(users, parsed.data);
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

app.get('/api/orders/me', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userOrders = orderService.listOrdersForUser(orders as Array<{ id: string; userId: string | null; status: string; total: number; createdAt: string }>, userId);

  return res.json({ items: userOrders.map((order) => ({
    id: order.id,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt
  })) });
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const order = orderService.getOrderForUser(orders as Array<{ id: string; userId: string | null }>, userId ?? 'guest', orderId) as Order | null;

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

app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
  const order = orders.find((item) => item.id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (!['PENDIENTE', 'EN_PREPARACION'].includes(order.status)) {
    return res.status(400).json({ message: 'Order cannot be cancelled in its current state' });
  }

  order.status = 'CANCELADO';
  order.paymentStatus = 'CANCELLED';

  for (const item of order.items) {
    const found = findVariant(item.variantId);
    if (found) {
      found.variant.stock += item.quantity;
    }
  }

  return res.json({
    orderId: order.id,
    status: order.status,
    inventoryReintegrated: true
  });
});

app.post('/api/admin/payments/:id/confirm', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!isAdmin(userId)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const order = orders.find((item) => item.id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.paymentStatus === 'CONFIRMED') {
    return res.status(409).json({ message: 'Payment already confirmed' });
  }

  order.paymentStatus = 'CONFIRMED';
  return res.json({ paymentStatus: 'CONFIRMED', orderStatus: order.status });
});

app.get('/api/admin/catalog/products', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!isAdmin(userId)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return res.json({ items: products });
});

app.patch('/api/admin/catalog/variants/:id', (req: Request, res: Response) => {
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
  return res.json(found.variant);
});

app.patch('/api/admin/orders/:id/status', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
  if (!isAdmin(userId)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const order = orders.find((item) => item.id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
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

  if (!allowed[order.status]?.includes(nextStatus)) {
    return res.status(400).json({ message: 'Invalid order status transition' });
  }

  order.status = nextStatus;
  return res.json({ orderId: order.id, status: order.status });
});

app.use((err: unknown, _req: Request, res: Response, _next: () => void) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Lacasaca backend listening on http://localhost:${port}`);
});
