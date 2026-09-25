export type Category = 'RETROS' | 'ACTUALES' | 'SELECCIONES' | 'FEMENINO' | 'NINOS';
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'WHATSAPP_TRANSFER';

export function paymentMethodLabel(method: PaymentMethod) {
  return method === 'CASH_ON_DELIVERY'
    ? 'Efectivo contraentrega'
    : 'Transferencia';
}

export type Variant = {
  id: string;
  sku?: string;
  attributes: Record<string, string | boolean>;
  price: number;
  stock: number;
  isActive: boolean;
  availabilityType?: 'IMMEDIATE' | 'MADE_TO_ORDER';
};

export type Product = {
  id: string;
  name: string;
  slug?: string;
  description: string;
  category: Category;
  availabilityType: 'IMMEDIATE' | 'MADE_TO_ORDER';
  isActive: boolean;
  featuredImage?: string;
  images?: string[];
  variants: Variant[];
};

export type CartItem = {
  id: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  availabilityType: 'IMMEDIATE' | 'MADE_TO_ORDER';
  unitPrice: number;
  quantity: number;
  stock?: number;
  subtotal: number;
};

export type Cart = { id: string; items: CartItem[]; total: number };
export type Session = { id: string; name: string; email: string; address?: string; role: 'CUSTOMER' | 'ADMIN'; mustChangePassword?: boolean };

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const headers = () => {
  const cartId = localStorage.getItem('lacasaca-cart-id') ?? 'guest-cart';
  const userId = localStorage.getItem('lacasaca-user-id');
  return {
    'Content-Type': 'application/json',
    'x-cart-id': cartId,
    ...(userId ? { 'x-user-id': userId } : {})
  };
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers(), ...options.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message ?? 'No pudimos completar la operación.') as Error & { retryAfterSeconds?: number };
    error.retryAfterSeconds = body.retryAfterSeconds;
    throw error;
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  listProducts(params: { search?: string; category?: string } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    return request<{ items: Product[]; total: number }>(`/catalog/products?${query}`);
  },
  getProduct(id: string) { return request<Product>(`/catalog/products/${id}`); },
  getCart() { return request<Cart>('/cart'); },
  addToCart(variantId: string, quantity = 1, attributes?: Record<string, string | boolean>) {
    return request<CartItem>('/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity, ...(attributes ? { attributes } : {}) }) });
  },
  updateCartItem(id: string, quantity: number) {
    return request<CartItem>(`/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
  },
  removeCartItem(id: string) { return request<void>(`/cart/items/${id}`, { method: 'DELETE' }); },
  checkout(payload: { paymentMethod: PaymentMethod; customer: { name: string; email: string; phone?: string; address: string }; guestCheckout: boolean }) {
    return request<{ orderId: string; status: string; paymentStatus: string; paymentMethod: PaymentMethod; subtotal: number; shippingCost: number; total: number; account?: Session }>('/checkout', { method: 'POST', body: JSON.stringify(payload) });
  },
  register(payload: { name: string; email: string; password: string }) {
    return request<Session>('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  login(payload: { email: string; password: string }) {
    return request<Session>('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  requestPasswordReset(email: string) {
    return request<{ message: string }>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) });
  },
  confirmPasswordReset(token: string, password: string) {
    return request<{ message: string }>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) });
  },
  setPassword(password: string) {
    return request<{ message: string }>('/auth/password', { method: 'POST', body: JSON.stringify({ password }) });
  },
  listOrders() { return request<{ items: Array<{ id: string; status: string; paymentMethod: PaymentMethod; paymentStatus: string; subtotal: number; shippingCost: number; total: number; createdAt: string }> }>('/orders/me'); },
  getOrder(id: string) { return request<{ id: string; status: string; paymentMethod: PaymentMethod; paymentStatus: string; subtotal: number; shippingCost: number; total: number; createdAt: string; items: Array<{ productName: string; quantity: number; unitPriceSnapshot: number; subtotal: number }> }>(`/orders/${id}`); },
  cancelOrder(id: string) { return request<{ orderId: string; status: string }>('/orders/' + id + '/cancel', { method: 'POST' }); }
  ,adminProducts(params: { search?: string; category?: string; availabilityType?: string } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.availabilityType && params.availabilityType !== 'ALL') query.set('availabilityType', params.availabilityType);
    return request<{ items: Product[] }>(`/admin/catalog/products?${query}`);
  }
  ,createAdminProduct(payload: { name: string; slug: string; description: string; category: Category; availabilityType: 'IMMEDIATE' | 'MADE_TO_ORDER'; variants: Array<{ sku?: string; attributes: Record<string, string | boolean>; price: number; stock: number }> }) { return request<{ id: string }>('/admin/catalog/products', { method: 'POST', body: JSON.stringify(payload) }); }
  ,updateAdminProduct(id: string, payload: Partial<{ name: string; slug: string; description: string; category: Category; availabilityType: 'IMMEDIATE' | 'MADE_TO_ORDER'; isActive: boolean }>) { return request<{ id: string }>(`/admin/catalog/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  ,deleteAdminProduct(id: string) { return request<void>(`/admin/catalog/products/${id}`, { method: 'DELETE' }); }
  ,updateAdminVariant(id: string, payload: { price?: number; stock?: number; isActive?: boolean }) { return request<Variant>(`/admin/catalog/variants/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  ,createAdminVariant(productId: string, payload: { sku: string; attributes: Record<string, string | boolean>; price: number; stock: number }) { return request<{ id: string }>(`/admin/catalog/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(payload) }); }
  ,deleteAdminVariant(id: string) { return request<void>(`/admin/catalog/variants/${id}`, { method: 'DELETE' }); }
  ,adminOrders() { return request<{ items: Array<{ id: string; status: string; paymentStatus: string; paymentMethod: PaymentMethod; total: number; shippingCost: number; createdAt: string; customerPhone?: string; userName?: string; email?: string }> }>('/admin/orders'); }
    ,createAdminOrder(payload: { userLegacyId?: string; customerPhone?: string; notes?: string; total?: number; paymentMethod: PaymentMethod; items?: Array<{ variantId: string; quantity: number }> }) { return request<{ orderId: string; status: string; paymentStatus: string; total: number }>('/admin/orders', { method: 'POST', body: JSON.stringify(payload) }); }
    ,updateAdminOrder(id: string, payload: { customerPhone?: string; paymentMethod?: PaymentMethod }) { return request<{ id: string }>(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  ,updateAdminOrderStatus(id: string, status: string) { return request<{ id: string; status: string }>(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
  ,deleteAdminOrder(id: string) { return request<void>(`/admin/orders/${id}`, { method: 'DELETE' }); }
  ,adminPayments() { return request<{ items: Array<{ id: string; status: string; method: PaymentMethod; externalReference?: string; orderId: string; orderStatus: string; total: number; userName?: string; email?: string }> }>('/admin/payments'); }
  ,updateAdminPaymentStatus(id: string, status: string) { return request<{ paymentId: string; paymentStatus: string; orderId: string; orderStatus: string }>(`/admin/payments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
  ,adminUsers() { return request<{ items: Array<{ id: string; name: string; email: string; address: string; role: 'CUSTOMER' | 'ADMIN'; isActive: boolean }> }>('/admin/users'); }
  ,createAdminUser(payload: { name: string; email: string; password: string; address?: string; role?: 'CUSTOMER' | 'ADMIN' }) { return request<{ id: string }>('/admin/users', { method: 'POST', body: JSON.stringify(payload) }); }
  ,updateAdminUser(id: string, payload: Partial<{ name: string; email: string; address: string; role: 'CUSTOMER' | 'ADMIN'; isActive: boolean }>) { return request<{ id: string }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  ,deleteAdminUser(id: string) { return request<void>(`/admin/users/${id}`, { method: 'DELETE' }); }
};

export function variantLabel(variant: Variant) {
  const size = variant.attributes.size ? `Talla: ${variant.attributes.size}` : '';
  const details = Object.entries(variant.attributes).filter(([key]) => key !== 'size').map(([key, value]) => `${key}: ${typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}`);
  return [size, ...details].filter(Boolean).join(' · ') || variant.sku || 'Única';
}