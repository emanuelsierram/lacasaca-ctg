<!--
Sync Impact Report
- Version change: unspecified existing document -> 1.0.0
- Modified principles: project scope and rules normalized into the resolved
	constitution structure; authentication clarified as explicit guest checkout.
- Added sections: Core Principles, Additional Constraints, Development Workflow,
	and Governance.
- Removed sections: none; existing domain rules were preserved and reorganized.
- Follow-up TODOs: confirm the original ratification date.
-->

# E-commerce de camisetas de fútbol Constitution

## Core Principles

### I. Catálogo Exclusivo de Fútbol

El sistema DEBE administrar exclusivamente camisetas de fútbol. Una camiseta es
un producto y cada combinación comercializable de talla, versión, temporada,
jugador u otro atributo del catálogo DEBE ser una variante independiente con un
identificador único. Un producto o variante inactiva NO PUEDE agregarse a nuevos
carritos ni utilizarse para crear pedidos.

### II. Inventario Sin Sobreventa

El stock de cada variante DEBE ser siempre mayor o igual que cero. Antes de
confirmar un pedido, el backend DEBE validar el stock suficiente para todas sus
variantes y descontarlo atómicamente. Dos operaciones concurrentes NO PUEDEN
consumir las mismas unidades. Agregar un producto al carrito NO reserva stock,
y una variante con stock cero NO PUEDE comprarse.

### III. Precios Históricos y Totales Confiables

Todo producto o variante comercializable DEBE tener un precio mayor que cero.
Cada pedido DEBE guardar una copia histórica del precio unitario vigente al
confirmarse, sin depender de cambios posteriores del catálogo. Los descuentos NO
PUEDEN producir precios finales negativos y el total DEBE calcularse en el
backend a partir de cantidades, precios, descuentos, envío y demás conceptos
aplicables; el total enviado por el cliente NO es fuente de verdad.

### IV. Carritos y Pedidos Válidos

Las cantidades DEBEN ser enteros mayores que cero. El carrito solo puede incluir
productos y variantes activos y disponibles, y todo aumento de cantidad DEBE
volver a validar las reglas de inventario. Una variante eliminada o deshabilitada
NO PUEDE generar un nuevo pedido.

El negocio define explícitamente compras como invitado, por lo que crear y
confirmar un pedido NO REQUIERE autenticación previa. Si existe un usuario
autenticado, solo puede modificar su propio carrito. Los pedidos confirmados
DEBEN conservar sus productos, variantes, cantidades y precios históricos de
forma independiente del catálogo actual.

### V. Estados de Pedido Controlados

Un pedido solo puede tener estados definidos por el dominio: `PENDIENTE`,
`EN_PREPARACION`, `ENVIADO`, `ENTREGADO` o `CANCELADO`. Cada transición DEBE
respetar las transiciones permitidas. Un pedido cancelado NO PUEDE volver a un
estado operativo y un pedido entregado NO PUEDE volver a un estado anterior
mediante una operación normal.

### VI. Seguridad y Autorización

La autenticación NO concede permisos administrativos. Las operaciones de
administración de productos, inventario, pedidos y precios DEBEN exigir permisos
suficientes. Las contraseñas NUNCA PUEDEN almacenarse en texto plano, y las APIs,
logs y respuestas NO DEBEN exponer datos sensibles innecesarios. Cada usuario
autenticado solo puede consultar o modificar recursos que le pertenezcan, salvo
operaciones administrativas autorizadas.

### VII. Integridad Transaccional

Las operaciones que modifiquen conjuntamente pedido, inventario o pago DEBEN
ser transaccionales cuando corresponda. NUNCA SE DEBE dejar un pedido confirmado
sin su cambio de inventario correspondiente. Si falla una operación crítica, el
sistema DEBE evitar estados parciales o inconsistentes y proteger las operaciones
concurrentes contra condiciones de carrera.

### VIII. Integridad Comercial y Fuente de Verdad

Ningún endpoint, servicio, tarea programada, integración externa, proceso
administrativo o código generado por IA PUEDE omitir las reglas de inventario,
precio, autenticación aplicable, autorización o estado. Las reglas DEBEN
validarse en el dominio y backend, no exclusivamente en el frontend. Toda
modificación de estas reglas requiere una decisión explícita del propietario y
una enmienda formal de esta constitución.

## Additional Constraints

La aplicación DEBE usar Angular y Tailwind CSS en el frontend, Node.js con
Express en el backend, PostgreSQL local como base de datos y TypeScript en todo
el stack. La estructura del proyecto DEBE mantenerse plana, con `/frontend`,
`/backend` y `/db`, evitando Clean Architecture y patrones innecesariamente
complejos.

La interfaz NO DEBE exponer errores crudos ni stack traces; los errores técnicos
DEBEN traducirse a mensajes comprensibles para el usuario. El backend DEBE usar
códigos HTTP semánticos, incluidos `400` para peticiones inválidas, `401` cuando
corresponda autenticación y `409` para conflictos de pedido.

## Development Workflow

El código DEBE priorizar funciones y componentes de Angular, evitando clases
salvo que sean obligatorias por el framework o una dependencia. Las funciones y
variables DEBEN usar camelCase; las interfaces y tipos, PascalCase.

Las funcionalidades DEBEN implementarse únicamente cuando estén documentadas en
`spec.md`. No se deben añadir pasarelas de pago, perfiles complejos ni otras
capacidades no especificadas. Cada cambio DEBE revisarse contra esta constitución
y verificar las reglas de dominio en el backend.

## Governance

Esta constitución prevalece sobre prácticas contradictorias. Toda enmienda DEBE
documentar el cambio, su motivación, impacto en el dominio y estrategia de
migración cuando aplique. El propietario del proyecto DEBE aprobar explícitamente
las modificaciones de reglas de dominio.

La versión usa semver: MAJOR para eliminar o redefinir reglas de forma
incompatible, MINOR para añadir o ampliar principios o secciones, y PATCH para
aclaraciones o correcciones no semánticas. Cada revisión de especificación,
plan, tareas y código DEBE comprobar el cumplimiento de esta constitución. Las
violaciones DEBEN corregirse antes de aceptar el cambio.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): confirmar fecha
original de adopción | **Last Amended**: 2026-09-15