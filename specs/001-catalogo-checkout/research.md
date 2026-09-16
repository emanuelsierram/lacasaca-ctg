# Research: Catalogo y checkout de camisetas

## Decision: arquitectura y reglas de dominio

### 1) Estructura de proyecto
- Decision: usar una estructura plana con tres capas: frontend, backend y db.
- Rationale: la constitucion exige Angular + Tailwind en frontend, Node.js con Express en backend, PostgreSQL local y TypeScript en todo el stack, con estructura plana para evitar complejidad innecesaria.
- Alternatives considered:
  - Monorepo con una sola app fullstack.
  - Arquitectura Clean Architecture con capas de dominio/infraestructura.
  - Microservicios separados por dominio.

### 2) Inventario y sobreventa
- Decision: el inventario se valida y descuenta de forma atomica al confirmar el pedido, nunca al agregar al carrito.
- Rationale: el spec y la constitucion exigen impedir sobreventa concurrente y asegurar que un pedido confirmado nunca quede sin descuento de inventario.
- Alternatives considered:
  - Reservar stock al agregar al carrito.
  - Validar cliente-side solamente.
  - Descontar por lote en un cronjob posterior.

### 3) Precios historicos
- Decision: cada OrderItem almacenara el precio unitario vigente y la variante comprada en el momento de la confirmacion.
- Rationale: la constitucion exige que el pedido conserve historial comercial y que el backend sea la fuente de verdad.
- Alternatives considered:
  - Guardar solo IDs y leer el precio actual en el momento de la consulta.
  - Permitir actualizaciones del precio del catalogo que cambien los pedidos ya cerrados.

### 4) Autorizacion administrativa
- Decision: la autenticacion no concede permisos; los endpoints de catalogo, inventario, precios y flujo de pedidos usan roles y permisos explicitamente verificados.
- Rationale: el spec distingue entre usuarios normales, invitados y administradores autorizados.
- Alternatives considered:
  - Basar permisos solo en la presencia de sesion.
  - Permitir que cualquier usuario autenticado administre catalogo.

### 5) Pago manual y confirmacion
- Decision: contraentrega y transferencia por WhatsApp son los unicos metodos permitidos; el pago no se marca como pagado hasta confirmacion valida y un administrador puede aprobar transferencias.
- Rationale: el negocio especifica pagos manuales, sin pasarelas, con validacion y evitar duplicados.
- Alternatives considered:
  - Integrar pasarelas externas.
  - Considerar transferencia como pagada automaticamente.

### 6) Estados de pedido y cancelacion
- Decision: se mantendra un estado enum con transiciones estrictas: PENDIENTE -> EN_PREPARACION -> ENVIADO -> ENTREGADO y una cancelacion solo permitida en PENDIENTE o EN_PREPARACION.
- Rationale: la constitucion y el spec definen estados controlados, cancelacion restringida y la prohibicion de reversiones normales.
- Alternatives considered:
  - Permitir cancelar desde cualquier estado.
  - Permitir volver a estados anteriores en operaciones normales.

## Research summary

- El backend debe ser la unica fuente de verdad para stock, precios, autorizacion y calculo del total.
- El carrito no reserva inventario; la reserva ocurre durante el checkout, dentro de una transaccion.
- Los pedidos deben preservar precios y cantidades historicas.
- Los administradores solo pueden realizar acciones autorizadas y la confirmacion manual de transferencias debe ser idempotente.
- La UI debe guiar errores comprensibles, pero nunca reemplazar las validaciones backend.

## Open issues resolved

Todas las decisiones necesarias para esta feature quedaron definidas por la especificacion y la constitucion. No quedan clarificaciones pendientes en el alcance de la entrega.