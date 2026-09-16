# API Contracts: Catalogo y checkout

## 1. Convenios generales

- Base path: `/api`
- Responses JSON en todos los endpoints.
- Códigos HTTP semánticos: 200, 201, 204, 400, 401, 403, 404, 409, 422, 500.
- El backend es la fuente de verdad para precio, stock, estado y autorizacion.
- Los errores no deben exponer stack traces ni detalles internos.

## 2. Catalogo

### GET /api/catalog/products
Request:
- query: `category`, `search`, `page`, `pageSize`

Response 200:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Camiseta FC Barcelona 2024",
      "slug": "barcelona-2024",
      "category": "ACTUALES",
      "availabilityType": "IMMEDIATE",
      "isActive": true,
      "featuredImage": "https://...",
      "variants": [
        {
          "id": "uuid",
          "sku": "BAR-2024-M",
          "attributes": { "size": "M", "version": "Home" },
          "price": 129.99,
          "stock": 12,
          "isActive": true
        }
      ]
    }
  ],
  "total": 25
}
```

### GET /api/catalog/products/:id
Response 200:
```json
{
  "id": "uuid",
  "name": "Camiseta ...",
  "description": "...",
  "category": "ACTUALES",
  "availabilityType": "IMMEDIATE",
  "images": ["https://..."],
  "variants": [
    {
      "id": "uuid",
      "sku": "BAR-2024-M",
      "attributes": { "size": "M", "version": "Home" },
      "price": 129.99,
      "stock": 12,
      "isActive": true
    }
  ]
}
```

## 3. Carrito

### GET /api/cart
Response 200:
```json
{
  "id": "uuid",
  "items": [
    {
      "id": "uuid",
      "variantId": "uuid",
      "productName": "Camiseta ...",
      "variantLabel": "M - Home",
      "unitPrice": 129.99,
      "quantity": 1,
      "subtotal": 129.99
    }
  ],
  "total": 129.99
}
```

### POST /api/cart/items
Request:
```json
{
  "variantId": "uuid",
  "quantity": 1
}
```

Validation:
- quantity debe ser entero > 0.
- variantId debe existir y estar activa.
- stock se valida al confirmar checkout, no al agregar al carrito.

Response 201:
```json
{
  "id": "uuid",
  "variantId": "uuid",
  "quantity": 1
}
```

### PATCH /api/cart/items/:id
Request:
```json
{
  "quantity": 2
}
```

Response 200:
```json
{
  "id": "uuid",
  "quantity": 2
}
```

### DELETE /api/cart/items/:id
Response 204

## 4. Checkout

### POST /api/checkout
Request:
```json
{
  "paymentMethod": "WHATSAPP_TRANSFER",
  "customer": {
    "name": "Ana",
    "email": "ana@example.com",
    "phone": "+5491112345678"
  },
  "guestCheckout": true
}
```

Validation:
- carrito no vacio.
- todas las variantes activas y con stock suficiente.
- precios vigentes validados en backend.
- paymentMethod permitido: CASH_ON_DELIVERY o WHATSAPP_TRANSFER.
- si paymentMethod es CASH_ON_DELIVERY, phone requerido.

Response 201:
```json
{
  "orderId": "uuid",
  "status": "PENDIENTE",
  "paymentStatus": "PENDING",
  "total": 189.99
}
```

## 5. Pedidos

### GET /api/orders/:id
Response 200:
```json
{
  "id": "uuid",
  "status": "PENDIENTE",
  "paymentStatus": "PENDING",
  "items": [
    {
      "variantId": "uuid",
      "productName": "Camiseta ...",
      "quantity": 1,
      "unitPriceSnapshot": 129.99,
      "subtotal": 129.99
    }
  ],
  "total": 129.99,
  "createdAt": "2026-09-16T12:00:00Z"
}
```

### GET /api/orders/me
Response 200:
```json
{
  "items": [
    {
      "id": "uuid",
      "status": "PENDIENTE",
      "total": 129.99,
      "createdAt": "2026-09-16T12:00:00Z"
    }
  ]
}
```

### POST /api/orders/:id/cancel
Response 200:
```json
{
  "orderId": "uuid",
  "status": "CANCELADO",
  "inventoryReintegrated": true
}
```

## 6. Pagos y administracion

### POST /api/admin/payments/:id/confirm
Request:
```json
{
  "confirmedByUserId": "uuid",
  "reference": "transfer-abc-123"
}
```

Validation:
- solo administradores autorizados pueden ejecutar esta accion.
- si la confirmacion ya fue procesada, responder 409.

Response 200:
```json
{
  "paymentStatus": "CONFIRMED",
  "orderStatus": "PENDIENTE"
}
```

### PATCH /api/admin/orders/:id/status
Request:
```json
{
  "status": "EN_PREPARACION"
}
```

Validation:
- estados solo permitidos segun la transicion del dominio.
- requiere permiso administrativo.

Response 200:
```json
{
  "orderId": "uuid",
  "status": "EN_PREPARACION"
}
```

## 7. Reglas de negocio contractuales

- No se puede crear un pedido si la variante no esta activa o no hay stock suficiente.
- El total final no puede venir del cliente; se recalcula en el backend.
- Un usuario autenticado solo puede consultar sus propios pedidos.
- Si el pago manual falla o expira, el inventario debe reintegrarse tras 24 horas.
- Cualquier accion administrativa debe autenticar y autorizar antes de ejecutarse.
