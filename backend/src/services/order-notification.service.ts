import { Resend } from 'resend';

type OrderNotification = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string | Date;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: Array<{
    productName: string;
    attributes: Record<string, string | boolean>;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
};

let adminRecipients: string[] = [];

function getRequiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character] ?? character));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function paymentMethodLabel(method: string) {
  return method === 'CASH_ON_DELIVERY' ? 'Efectivo contraentrega' : 'Transferencia';
}

function attributesLabel(attributes: Record<string, string | boolean>) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== '' && value !== false)
    .map(([key, value]) => `${key}: ${value === true ? 'Sí' : value}`)
    .join(' · ');
}

function renderText(order: OrderNotification) {
  const items = order.items.map((item) => {
    const attributes = attributesLabel(item.attributes);
    return `- ${item.productName}${attributes ? ` (${attributes})` : ''} | Cantidad: ${item.quantity} | Precio unitario: ${formatMoney(item.unitPrice)} | Subtotal: ${formatMoney(item.subtotal)}`;
  }).join('\n');

  return `Nuevo pedido recibido en La Casaca

Pedido: ${order.id}
Fecha: ${new Date(order.createdAt).toLocaleString('es-CO')}
Estado: ${order.status}
Estado del pago: ${order.paymentStatus}
Método de pago: ${paymentMethodLabel(order.paymentMethod)}

Datos del cliente
Nombre: ${order.customer.name}
Correo: ${order.customer.email}
Teléfono: ${order.customer.phone}
Dirección: ${order.customer.address}

Productos
${items}

Resumen
Subtotal: ${formatMoney(order.subtotal)}
Envío: ${formatMoney(order.shippingCost)}
Total: ${formatMoney(order.total)}`;
}

function renderHtml(order: OrderNotification) {
  const items = order.items.map((item) => {
    const attributes = attributesLabel(item.attributes);
    return `<tr>
      <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;">
        <strong>${escapeHtml(item.productName)}</strong>${attributes ? `<br><span style="font-size:12px;color:#64748b;">${escapeHtml(attributes)}</span>` : ''}
      </td>
      <td align="center" style="padding:12px 8px;border-bottom:1px solid #e2e8f0;">${item.quantity}</td>
      <td align="right" style="padding:12px 8px;border-bottom:1px solid #e2e8f0;">${formatMoney(item.unitPrice)}</td>
      <td align="right" style="padding:12px 8px;border-bottom:1px solid #e2e8f0;">${formatMoney(item.subtotal)}</td>
    </tr>`;
  }).join('');

  const detail = (label: string, value: string) => `<tr><td style="padding:5px 0;color:#64748b;">${label}</td><td style="padding:5px 0;text-align:right;font-weight:600;">${escapeHtml(value)}</td></tr>`;

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f4f6f8;color:#0c1715;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Nuevo pedido ${escapeHtml(order.id)} recibido en La Casaca.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#111827;padding:28px 32px;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#d9a441;">La Casaca</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">Nuevo pedido recibido</h1>
            <p style="margin:10px 0 0;color:#cbd5e1;">Pedido ${escapeHtml(order.id)}</p>
          </td></tr>
          <tr><td style="padding:32px;">
            <h2 style="margin:0 0 14px;font-size:18px;">Datos del cliente</h2>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;line-height:1.5;">
              ${detail('Nombre', order.customer.name)}
              ${detail('Correo', order.customer.email)}
              ${detail('Teléfono', order.customer.phone)}
              ${detail('Dirección', order.customer.address)}
            </table>
            <h2 style="margin:28px 0 14px;font-size:18px;">Datos del pedido</h2>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;line-height:1.5;">
              ${detail('Fecha', new Date(order.createdAt).toLocaleString('es-CO'))}
              ${detail('Estado', order.status)}
              ${detail('Estado del pago', order.paymentStatus)}
              ${detail('Método de pago', paymentMethodLabel(order.paymentMethod))}
            </table>
            <h2 style="margin:28px 0 14px;font-size:18px;">Productos</h2>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;border-collapse:collapse;">
              <thead><tr style="color:#64748b;font-size:12px;text-transform:uppercase;"><th align="left" style="padding:8px;">Producto</th><th align="center" style="padding:8px;">Cant.</th><th align="right" style="padding:8px;">Unitario</th><th align="right" style="padding:8px;">Subtotal</th></tr></thead>
              <tbody>${items}</tbody>
            </table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px;font-size:14px;">
              ${detail('Subtotal', formatMoney(order.subtotal))}
              ${detail('Envío', formatMoney(order.shippingCost))}
              <tr><td style="padding:10px 0;border-top:1px solid #cbd5e1;font-size:18px;font-weight:700;">Total</td><td style="padding:10px 0;border-top:1px solid #cbd5e1;text-align:right;font-size:18px;font-weight:700;">${formatMoney(order.total)}</td></tr>
            </table>
          </td></tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">La Casaca · Este mensaje fue enviado automáticamente</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

export const orderNotificationService = {
  setAdminRecipients(recipients: string[]) {
    adminRecipients = [...new Set(recipients.map((recipient) => recipient.trim()).filter(Boolean))];
  },

  async sendNewOrderEmail(order: OrderNotification) {
    if (adminRecipients.length === 0) {
      throw new Error('No active admin recipients configured');
    }
    const resend = new Resend(getRequiredEnvironment('RESEND_API_KEY'));
    const from = getRequiredEnvironment('RESEND_ORDER_FROM_EMAIL');
    const { error } = await resend.emails.send({
      from,
      to: adminRecipients,
      subject: `Nuevo pedido ${order.id} en La Casaca`,
      text: renderText(order),
      html: renderHtml(order)
    });

    if (error) {
      throw new Error(`New order email failed: ${error.message}`);
    }
  }
};
