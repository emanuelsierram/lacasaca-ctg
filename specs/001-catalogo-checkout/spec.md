# Feature Specification: Catalogo y checkout de camisetas

**Feature Branch**: `001-catalogo-checkout`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "Especificacion del producto para un e-commerce de camisetas de futbol con catalogo, busqueda, variantes, carrito, autenticacion, checkout, pagos manuales, pedidos, estados y administracion."
## Clarifications

### Session 2026-09-15

- Q: ¿En qué estados debe permitirse cancelar un pedido? → A: `PENDIENTE` y `EN_PREPARACION`
- Q: ¿Quién puede confirmar manualmente una transferencia recibida por WhatsApp? → A: Solo administradores autorizados
- Q: ¿Quién puede avanzar un pedido entre `PENDIENTE`, `EN_PREPARACION`, `ENVIADO` y `ENTREGADO`? → A: Solo administradores autorizados
- Q: ¿Cuándo debe descontarse el inventario en los pedidos con pago manual pendiente? → A: Al crear el pedido, con reintegro si falla o expira el pago
- Q: ¿Cuánto tiempo debe permanecer reservado el inventario antes de que expire un pago manual pendiente? → A: 24 horas

La cancelacion solo esta permitida en los estados `PENDIENTE` y `EN_PREPARACION`; los
pedidos en `ENVIADO` o `ENTREGADO` no pueden cancelarse mediante la operacion normal.
Las transferencias via WhatsApp solo pueden confirmarse manualmente por administradores
autorizados.
Solo administradores autorizados pueden avanzar un pedido entre `PENDIENTE`,
`EN_PREPARACION`, `ENVIADO` y `ENTREGADO`.
Los pedidos con pago manual pendiente descuentan el inventario al crearse y lo reintegran
si el pago falla o expira despues de 24 horas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprar una camiseta (Priority: P1)

Como comprador, quiero explorar el catalogo, elegir una variante disponible y completar
el checkout para comprar una camiseta sin que el sistema permita ventas sin inventario.

**Why this priority**: Es el flujo principal que entrega el valor comercial del producto.

**Independent Test**: Con productos y variantes disponibles, se puede seleccionar una
variante, agregarla al carrito, confirmar el checkout y consultar el pedido creado.

**Acceptance Scenarios**:

1. **Given** un producto activo con una variante con stock, **When** el comprador selecciona
   la variante y la agrega al carrito, **Then** el carrito muestra producto, variante,
   precio unitario, cantidad y subtotal.
2. **Given** un carrito con productos validos, **When** el comprador inicia checkout,
   **Then** el sistema vuelve a validar actividad, cantidades, precios y stock antes de
   crear el pedido.
3. **Given** un checkout valido, **When** el comprador selecciona un metodo de pago
   habilitado y confirma, **Then** el sistema calcula el total, crea un pedido unico,
   conserva sus precios y cantidades, y descuenta el inventario de forma consistente.
4. **Given** una variante con stock cero, **When** el comprador intenta agregarla al
   carrito, **Then** la accion no esta disponible y la variante aparece como agotada.

---

### User Story 2 - Encontrar productos y revisar stock (Priority: P1)

Como comprador, quiero navegar, buscar y filtrar camisetas para identificar rapidamente
los productos y variantes que puedo comprar.

**Why this priority**: Permite descubrir productos y reduce intentos de compra sobre
articulos no disponibles.

**Independent Test**: Con productos de varias categorias, se puede filtrar, buscar por
nombre, abrir un detalle y distinguir variantes disponibles de agotadas.

**Acceptance Scenarios**:

1. **Given** un catalogo con productos activos de distintas categorias, **When** el
   comprador filtra por categoria, **Then** solo se muestran productos de esa categoria.
2. **Given** productos registrados, **When** el comprador busca por nombre, **Then** los
   resultados muestran informacion suficiente para identificar cada producto.
3. **Given** una busqueda sin coincidencias, **When** se muestran los resultados, **Then**
   el sistema informa que no se encontraron productos.
4. **Given** un producto con variantes de precios distintos, **When** el comprador cambia
   la variante seleccionada, **Then** el precio mostrado corresponde a esa variante.

---

### User Story 3 - Gestionar cuenta y pedidos propios (Priority: P2)

Como usuario registrado, quiero crear una cuenta, iniciar sesion y consultar solo mis
pedidos para revisar sus detalles y estados.

**Why this priority**: Aporta trazabilidad y privacidad para usuarios recurrentes, sin
impedir la compra como invitado.

**Independent Test**: Un usuario puede registrarse con correo unico, iniciar y cerrar
sesion, consultar sus pedidos y comprobar que no puede acceder a pedidos de otra cuenta.

**Acceptance Scenarios**:

1. **Given** un correo no registrado, **When** el usuario crea una cuenta con correo y
   contrasena, **Then** la cuenta se crea sin almacenar la contrasena en texto plano.
2. **Given** una cuenta existente, **When** el usuario inicia sesion, **Then** puede
   acceder a las funcionalidades que requieren cuenta y cerrar sesion posteriormente.
3. **Given** pedidos pertenecientes y no pertenecientes al usuario autenticado, **When**
   abre Mis Pedidos, **Then** solo ve sus propios pedidos y sus detalles.
4. **Given** una compra como invitado, **When** el comprador confirma el pedido, **Then**
   el pedido se crea sin exigir una sesion previa.

---

### User Story 4 - Administrar catalogo e inventario (Priority: P2)

Como administrador autorizado, quiero gestionar productos, variantes, precios e inventario
para mantener actualizado el catalogo sin modificar el historial de pedidos.

**Why this priority**: Mantiene la oferta comercial y permite operar el negocio de forma
controlada.

**Independent Test**: Un administrador autorizado puede crear, actualizar, desactivar y
ajustar productos, variantes, precios e inventario; un usuario sin permisos no puede
hacerlo; los pedidos anteriores conservan sus datos.

**Acceptance Scenarios**:

1. **Given** un usuario con permisos administrativos, **When** crea o actualiza un
   producto y sus variantes, **Then** el catalogo refleja los cambios y cada variante
   mantiene su propio identificador e inventario.
2. **Given** una variante incluida en un pedido existente, **When** el administrador
   cambia su precio actual, **Then** el precio historico del pedido permanece igual.
3. **Given** un usuario sin permisos administrativos, **When** intenta modificar el
   catalogo o inventario, **Then** la operacion es rechazada.
4. **Given** un producto o variante desactivado, **When** un comprador consulta el
   catalogo o checkout, **Then** no puede usarlo para una nueva compra.

---

### User Story 5 - Gestionar estados y cancelacion (Priority: P3)

Como usuario autenticado, quiero consultar y solicitar la cancelacion de pedidos que lo
permitan para conocer su estado y evitar procesar una venta cancelada.

**Why this priority**: Completa el ciclo posterior a la compra y protege la consistencia
entre pedido, inventario y pago.

**Independent Test**: Un usuario puede seleccionar un pedido cancelable, solicitar su
cancelacion y comprobar que el estado cambia de forma valida y que el inventario se
reintegra cuando corresponde.

**Acceptance Scenarios**:

1. **Given** un pedido en un estado que permite cancelacion, **When** el usuario solicita
   cancelarlo, **Then** el sistema valida el estado, procesa la cancelacion y reintegra el
   inventario cuando corresponde.
2. **Given** un pedido cancelado, **When** alguien intenta volver a procesarlo como venta,
   **Then** la operacion es rechazada.
3. **Given** un pedido entregado, **When** alguien intenta devolverlo a un estado anterior
   mediante una operacion normal, **Then** la transicion es rechazada.

### Edge Cases

- Si dos compradores intentan confirmar simultaneamente la ultima unidad de una variante,
  solo uno puede completar la compra y el otro recibe un mensaje comprensible de falta de
  stock; el inventario nunca queda negativo.
- Si el stock cambia despues de agregar un producto al carrito, el checkout vuelve a
  validarlo y rechaza la confirmacion si la cantidad ya no esta disponible.
- Si el precio cambia mientras un producto esta en el carrito, el sistema usa el precio
  vigente validado en checkout y guarda ese valor en el pedido.
- Si se intenta aumentar una cantidad por encima del stock, el cambio se rechaza sin
  modificar la cantidad valida existente.
- Si una variante se desactiva despues de estar en un carrito, no puede generar un pedido.
- Si se envia un total alterado por el cliente, el sistema ignora ese valor y recalcula el
  total a partir de los conceptos validos.
- Si un pago manual es rechazado, incompleto o ya fue procesado, el pedido no se marca como
  pagado ni se procesa dos veces.
- Si un pago manual falla o expira despues de crear el pedido, el sistema reintegra el
  inventario reservado despues de 24 horas sin dejar stock negativo ni un pedido pagado.
- El pago contraentrega solo se ofrece para productos con disponibilidad inmediata y requiere un
  numero de telefono.
- Si una operacion critica falla durante la confirmacion, no debe quedar un pedido
  confirmado sin el descuento de inventario correspondiente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar un catalogo exclusivamente de camisetas de futbol
  disponibles o previamente publicadas, organizado por categorias como retros, actuales,
  selecciones, femenino y ninos.
- **FR-002**: Cada producto DEBE mostrar nombre, imagen, precio, descripcion y disponibilidad (pedido o inmediata).
- **FR-003**: El sistema DEBE permitir navegar por el catalogo, filtrar por categoria y
  buscar por nombre.
- **FR-004**: Una busqueda sin resultados DEBE mostrar un mensaje indicando que no se
  encontraron productos.
- **FR-005**: El detalle de un producto DEBE mostrar nombre, imagenes, precio, descripcion,
  variantes y disponibilidad (pedido o inmediata).
- **FR-006**: Cada combinacion comercializable DEBE gestionarse como una variante con
  identificador e inventario propios.
- **FR-007**: Las variantes sin inventario DEBEN identificarse como agotadas y no pueden
  agregarse al carrito.
- **FR-008**: Los productos y variantes desactivados NO DEBEN estar disponibles para nuevas
  compras.
- **FR-009**: El sistema DEBE exigir la seleccion de una variante cuando el producto tenga
  variantes.
- **FR-010**: El carrito DEBE permitir agregar, consultar, modificar y eliminar productos,
  mostrando producto, variante, precio unitario, cantidad y subtotal.
- **FR-011**: Las cantidades DEBEN ser enteros mayores que cero y no superar el inventario
  disponible en el momento de cada validacion.
- **FR-012**: El sistema DEBE recalcular subtotales y total del carrito despues de cada
  modificacion.
- **FR-013**: Agregar un producto al carrito NO DEBE reservar inventario; el checkout DEBE
  volver a validar todas las variantes antes de crear el pedido y reservar su inventario.
- **FR-014**: El sistema DEBE permitir registrarse con correo y contrasena, iniciar y
  cerrar sesion, y exigir que cada correo sea unico.
- **FR-015**: Las credenciales DEBEN manejarse de forma segura y las contrasenas NO PUEDEN
  almacenarse en texto plano.
- **FR-016**: Las compras como invitado DEBEN poder crear y confirmar pedidos sin una sesion
  previa; las funcionalidades exclusivas de cuenta DEBEN requerir autenticacion.
- **FR-017**: Antes de crear un pedido, el sistema DEBE validar actividad de productos y
  variantes, cantidades validas, disponibilidad, stock suficiente y precios vigentes.
- **FR-018**: El total del pedido DEBE calcularse a partir de cantidades, precios, descuentos,
  envio y demas conceptos aplicables; el cliente NO PUEDE proporcionar ni modificar el
  total final.
- **FR-019**: La creacion del pedido DEBE descontar y reservar el inventario de forma
  atomica y consistente, impidiendo sobreventa en operaciones concurrentes. Si el pago
  manual falla o expira, el sistema DEBE reintegrar el inventario reservado.
- **FR-020**: Cada pedido DEBE tener un identificador unico y conservar como historicos los
  precios unitarios, variantes y cantidades usados en la compra.
- **FR-021**: El checkout DEBE permitir seleccionar Contraentrega o transferencia via
  WhatsApp, sin integrar una pasarela de pagos.
- **FR-022**: El pedido NO DEBE marcarse como pagado hasta recibir una confirmacion valida
  del metodo seleccionado; un pago fallido o rechazado NO PUEDE confirmar el pedido.
- **FR-023**: El sistema DEBE asociar el resultado de pago al pedido, permitir que solo
  administradores autorizados confirmen transferencias via WhatsApp y evitar procesar mas
  de una vez la misma confirmacion.
- **FR-024**: Contraentrega DEBE requerir un numero de telefono y solo estar disponible
  para productos con disponibilidad inmediata.
- **FR-025**: Los usuarios autenticados DEBEN poder consultar sus pedidos actuales e
  historicos, incluyendo identificador, fecha, productos, variantes, cantidades, precios,
  total, estado del pedido y estado del pago.
- **FR-026**: Un usuario autenticado NO PUEDE consultar pedidos pertenecientes a otra cuenta.
- **FR-027**: Los estados permitidos DEBEN ser `PENDIENTE`, `EN_PREPARACION`, `ENVIADO`,
  `ENTREGADO` y `CANCELADO`, con transiciones definidas y sin cambios arbitrarios. La
  cancelacion solo puede solicitarse desde `PENDIENTE` o `EN_PREPARACION`, y solo los
  administradores autorizados pueden avanzar pedidos entre estados operativos.
- **FR-028**: Un pedido cancelado NO PUEDE volver a procesarse como venta activa y un pedido
  entregado NO PUEDE volver a un estado anterior mediante una operacion normal.
- **FR-029**: Los administradores autorizados DEBEN poder crear, actualizar y desactivar
  productos, gestionar variantes, actualizar precios y gestionar inventario.
- **FR-030**: Las operaciones administrativas DEBEN requerir permisos suficientes y no deben
  alterar productos, variantes, cantidades ni precios historicos de pedidos existentes.
- **FR-031**: El sistema DEBE proporcionar navegacion clara entre catalogo, detalle, carrito,
  checkout y pedidos, junto con mensajes comprensibles para errores de stock,
  inventario, autenticacion y pago.
- **FR-032**: La interfaz DEBE impedir acciones que el backend rechaza, sin sustituir las
  validaciones del backend como fuente de verdad.
- **FR-033**: Si una cancelacion corresponde a reintegro de inventario, el
  sistema DEBE procesarlo de acuerdo con las reglas aplicables y mantener el pedido
  consistente.

### Key Entities *(include if feature involves data)*

- **Producto**: Camiseta de futbol publicada en el catalogo, con nombre, imagenes,
  descripcion, categoria, disponibilidad (pedido o inmediata) y estado de actividad.
- **Variante**: Combinacion comercializable de un producto, con identificador, atributos (talla, versión, long sleeves, jugador),
  precio, stock, disponibilidad (pedido o inmediata) y estado propio.
- **Categoria**: Clasificacion de camisetas, incluyendo retros, actuales, selecciones,
  femenino y ninos.
- **Usuario**: Persona con correo unico y credenciales seguras, cuando decide crear una
  cuenta.
- **Carrito**: Conjunto de variantes y cantidades seleccionadas antes del checkout; no
  reserva inventario.
- **Pedido**: Compra identificada unicamente, con productos, variantes, cantidades, precios
  historicos, total, estado y asociacion opcional con un usuario.
- **Pago**: Resultado asociado a un pedido y a un metodo habilitado, con estado y referencia
  de confirmacion procesada una sola vez.
- **Metodo de Pago**: Contraentrega o transferencia via WhatsApp, con sus restricciones de
  disponibilidad.
- **Inventario**: Stock disponible por variante, que no puede ser negativo y se descuenta de
  forma consistente al confirmar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 95% de las busquedas con coincidencias muestran resultados
  identificables en un maximo de 2 segundos durante pruebas representativas.
- **SC-002**: Al menos el 90% de compradores de prueba pueden pasar del catalogo a un
  checkout confirmado en menos de 3 minutos cuando hay stock disponible.
- **SC-003**: En 100% de las pruebas de compra concurrente de la ultima unidad, exactamente
  una compra se confirma y ninguna deja inventario negativo.
- **SC-004**: En 100% de los pedidos confirmados, el identificador, cantidades, variantes,
  precios historicos y total permanecen sin cambios despues de actualizar el catalogo.
- **SC-005**: En 100% de las pruebas de autorizacion, un usuario autenticado solo puede
  consultar sus propios pedidos y un usuario sin permisos no puede administrar catalogo,
  precios o inventario.
- **SC-006**: En al menos el 95% de las pruebas de usabilidad, los participantes entienden
  si una variante esta disponible, agotada o no puede comprarse.
- **SC-007**: En 100% de los casos de confirmacion con pago rechazado o stock insuficiente,
  el sistema no marca el pedido como pagado ni confirma una venta invalida.

## Assumptions

- Las compras como invitado son parte explicita del alcance; la cuenta es necesaria solo
  para funcionalidades como Mis Pedidos, historial y cancelacion asociada a usuario.
- Las categorias indicadas son suficientes para la primera version y pertenecen al dominio
  de camisetas de futbol.
- Los metodos de pago son exclusivamente Contraentrega y transferencia via WhatsApp; no se
  construira ni conectara una pasarela de pagos.
- La confirmacion de transferencia via WhatsApp se registra como confirmacion manual valida
  del negocio realizada por un administrador autorizado y debe poder identificarse para
  evitar duplicados.
- El inventario de un pedido con pago manual pendiente se reserva durante 24 horas; si el
  pago no se confirma en ese plazo, la reserva se libera.
- La entrega inmediata se determina por la disponibilidad configurada del producto o sus
  variantes y es requisito para Contraentrega.
- El numero de telefono usado para Contraentrega debe ser unico entre pedidos activos que
  usen ese metodo.
- El envio y descuentos pueden existir como conceptos del pedido, pero sus
  reglas detalladas se definiran en el diseño del checkout sin permitir totales negativos.
- Los administradores son usuarios autenticados con permisos adicionales; los compradores
  invitados no obtienen capacidades administrativas.
- La cancelacion solo esta disponible para estados definidos por las reglas de negocio y
  puede requerir reintegro de inventario.
- La navegacion debe funcionar en dispositivos de escritorio y moviles con conexion estable.
