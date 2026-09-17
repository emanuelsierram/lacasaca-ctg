# Data Model: Catalogo y checkout de camisetas

## 1. Entidades principales

### Product
- id: UUID
- slug: string
- name: string
- description: text
- categoryId: UUID
- isActive: boolean
- availabilityType: enum { IMMEDIATE, MADE_TO_ORDER }
- createdAt: timestamp
- updatedAt: timestamp

Validation rules:
- name y description obligatorios.
- categoryId debe apuntar a una categoria existente.
- availabilityType debe ser IMMEDIATE o MADE_TO_ORDER.
- isActive false bloquea nuevas compras.

### Category
- id: UUID
- name: enum { RETROS, ACTUALES, SELECCIONES, FEMENINO, NINOS }
- slug: string
- isActive: boolean

Validation rules:
- name debe corresponder a una categoria del dominio.
- slug unico.

### Variant
- id: UUID
- productId: UUID
- sku: string
- attributes: jsonb con `size`, `version`, `long-sleeves` (boolean), `tournament` y `dorsal`; los productos sobre pedido permiten configurar estos valores desde el detalle.
- price: decimal(12,2)
- stock: integer
- isActive: boolean
- availabilityType: enum { IMMEDIATE, MADE_TO_ORDER }
- createdAt: timestamp
- updatedAt: timestamp

Validation rules:
- price > 0.
- stock >= 0.
- sku unico.
- attributes debe describir talla, version, long sleeves, jugador u otros atributos del catalogo.
- si isActive = false, no puede participar en pedidos nuevos.

### User
- id: UUID
- email: string
- passwordHash: string
- role: enum { CUSTOMER, ADMIN }
- isActive: boolean
- createdAt: timestamp

Validation rules:
- email unico.
- passwordHash nunca en texto plano.
- administrador requiere permisos adicionales no heredados por usuarios autenticados simples.

### Cart
- id: UUID
- userId: UUID | null
- guestSessionId: string | null
- createdAt: timestamp
- updatedAt: timestamp

Validation rules:
- el carrito puede pertenecer a un usuario autenticado o a un invitado.
- un usuario autenticado solo puede modificar su propio carrito.

### CartItem
- id: UUID
- cartId: UUID
- variantId: UUID
- quantity: integer
- unitPriceSnapshot: decimal(12,2)
- createdAt: timestamp
- updatedAt: timestamp

Validation rules:
- quantity integer > 0.
- unitPriceSnapshot debe reflejar el precio validado del catalogo en el momento de agregar o actualizar.
- la cantidad nunca puede exceder el stock disponible en validacion del checkout.

### Order
- id: UUID
- userId: UUID | null
- status: enum { PENDIENTE, EN_PREPARACION, ENVIADO, ENTREGADO, CANCELADO }
- paymentMethod: enum { CASH_ON_DELIVERY, WHATSAPP_TRANSFER }
- paymentStatus: enum { PENDIENTE, CONFIRMADO, RECHAZADO, EXPIRADO, CANCELADO }
- total: decimal(12,2)
- shippingCost: decimal(12,2)
- notes: text
- createdAt: timestamp
- updatedAt: timestamp

Validation rules:
- total > 0.
- paymentStatus no puede ser CONFIRMADO antes de confirmacion valida.
- status transiciones deben seguir la secuencia definida.
- un pedido invitado es valido sin autenticacion previa.

### OrderItem
- id: UUID
- orderId: UUID
- variantId: UUID
- productId: UUID
- quantity: integer
- unitPriceSnapshot: decimal(12,2)
- subtotal: decimal(12,2)
- createdAt: timestamp

Validation rules:
- guarda el historico de precio, cantidad y variante usados en la compra.
- no se puede cambiar despues de la confirmacion.

### Payment
- id: UUID
- orderId: UUID
- method: enum { CASH_ON_DELIVERY, WHATSAPP_TRANSFER }
- externalReference: string | null
- status: enum { PENDIENTE, CONFIRMADO, RECHAZADO, EXPIRADO, CANCELADO }
- confirmationByUserId: UUID | null
- confirmedAt: timestamp | null
- createdAt: timestamp

Validation rules:
- una confirmacion manual por WhatsApp solo puede ejecutarse por admin autorizado.
- externalReference debe ser unico para la misma transaccion.
- la confirmacion no debe procesarse dos veces.

## 2. Relaciones

- Category 1:N Product
- Product 1:N Variant
- User 1:N Cart
- Cart 1:N CartItem
- Variant 1:N CartItem
- User 1:N Order (opcional)
- Order 1:N OrderItem
- Variant 1:N OrderItem
- Order 1:1 Payment

## 3. Estados de pedido

| Estado | Permite cancelacion | Siguiente estado permitido |
|---|---|---|
| PENDIENTE | Si | EN_PREPARACION, CANCELADO |
| EN_PREPARACION | Si | ENVIADO, CANCELADO |
| ENVIADO | No | ENTREGADO |
| ENTREGADO | No | Ninguno normal |
| CANCELADO | No | Ninguno |

Reglas:
- la cancelacion solo ocurre en PENDIENTE y EN_PREPARACION.
- un pedido cancelado no puede reabrirse.
- un pedido entregado no se puede devolver a un estado anterior por una operacion normal.
- solo administradores autorizados pueden avanzar entre estados operativos.

## 4. Reglas de inventario

- stock de cada variante nunca puede ser negativo.
- el checkout debe validar stock real y cantidades antes de crear el pedido.
- el descuento se hace de forma atomica al confirmar pedido.
- si un pago manual falla o expira, el inventario reservado se reintegra.

## 5. Entidades administrativas

### AdminActionLog
- id: UUID
- adminUserId: UUID
- action: string
- entityType: string
- entityId: UUID
- metadata: jsonb
- createdAt: timestamp

This helps trace catalog and order state changes, while respecting the requirement that admin actions be auditable and explicit.
