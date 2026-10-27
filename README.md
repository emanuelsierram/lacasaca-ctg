# Lacasaca CTG

E-commerce de camisetas de fútbol con catálogo, carrito, checkout, autenticación, administración e historial de pedidos.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Ejecutar la app

Backend:

```bash
cd backend
npm install
npm run dev
```

Antes de iniciar el backend, configura PostgreSQL. Copia `backend/.env.example` como
`backend/.env` y ajusta `PGPASSWORD` o `DATABASE_URL` con las credenciales de tu servidor.
La base `lacasaca` debe existir en PostgreSQL; el backend crea la tabla `app_state` al iniciar.
Para enviar notificaciones de nuevos pedidos, configura `RESEND_API_KEY` y
`RESEND_ORDER_FROM_EMAIL` con el correo autorizado en Resend.
Los destinatarios se cargan una vez al iniciar el backend desde los usuarios activos
con rol `ADMIN` y se reutilizan para todos los pedidos.

Frontend:

```bash
cd frontend
npm run start
```

## Validaciones rápidas

```bash
cd backend
npm test
```

```bash
cd backend
npm run build
cd ../frontend
npm run build
```

## Flujo principal

- Catálogo con búsqueda y filtros por categoría
- Detalle de producto con variantes y disponibilidad
- Carrito con validación de stock
- Checkout con total calculado por el backend
- Registro y login de usuarios
- Pedidos propios y acceso restringido
- Administrador para catalogo e inventario
- Ciclos de pago y cancelación de pedidos
