# Quickstart: validacion del flujo principal

## Prerequisitos

- Node.js 20 LTS
- PostgreSQL 15 local
- npm o pnpm
- acceso a la aplicacion frontend y backend en entorno local

## 1. Preparar base de datos

1. Crear la base de datos del proyecto.
2. Ejecutar migraciones para crear tablas de productos, variantes, cart, orders, payments y permisos.
3. Cargar datos de ejemplo para categorias y variantes activas.

Ejemplo de comandos esperados:

```bash
cd /db
npm install
npm run migrate
npm run seed:demo
```

## 2. Iniciar backend

```bash
cd /backend
npm install
npm run dev
```

Resultado esperado:
- el servicio escucha en localhost con endpoints HTTP semanticos.
- las validaciones de stock, precio y estado se aplican en backend.

## 3. Iniciar frontend

```bash
cd /frontend
npm install
npm run start
```

Resultado esperado:
- la app carga catalogo, detalle, carrito y checkout.
- la UI muestra mensajes comprensibles cuando no hay stock o autorizacion invalida.

## 4. Escenarios de validacion

### Catalogo y busqueda
1. Abrir la home del catalogo.
2. Filtrar por categoria como `retros` o `selecciones`.
3. Buscar por nombre de camiseta.
4. Verificar que un producto sin coincidencias muestra mensaje de sin resultados.

Resultado esperado:
- solo se muestran productos activos y publicables.
- variantes agotadas se identifican como agotadas.

### Compra con stock disponible
1. Seleccionar una variante con stock > 0.
2. Agregar al carrito.
3. Confirmar checkout.
4. Elegir pago con transferencia o contraentrega.
5. Crear pedido.

Resultado esperado:
- el total se calcula en backend.
- el pedido recibe identificador unico.
- el inventario se descuenta de forma consistente.

### Validacion de stock
a) intentar agregar una variante agotada al carrito;
b) intentar comprar mas unidades que el stock disponible;
c) confirmar checkout con un producto desactivado.

Resultado esperado:
- operaciones rechazadas con mensajes comprensibles.
- stock nunca negativo.

### Compra como invitado
1. Iniciar checkout sin iniciar sesion.
2. Confirmar pedido.

Resultado esperado:
- la compra se acepta sin login previo.
- las funciones de cuenta quedan restringidas a usuarios autenticados.

### Administracion y estados
1. Iniciar sesion como administrador autorizado.
2. Crear o editar un producto y su variante.
3. Avanzar un pedido de PENDIENTE a EN_PREPARACION y luego a ENVIADO.
4. Confirmar transferencia por WhatsApp.

Resultado esperado:
- solo el admin autorizado puede realizar estas acciones.
- la confirmacion de pago es idempotente y no duplica registros.

## 5. Criterios de salida

La feature se considera lista cuando se cumplen estos puntos:
- catalogo muestra productos activos y variantes legibles;
- carrito no reserva stock antes del checkout;
- checkout valida stock, precio e inventario de forma atomica;
- administracion y estados requieren permisos; y
- pagos manuales y cancelaciones respetan las reglas de negocio.
