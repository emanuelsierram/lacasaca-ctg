# Implementation Plan: Catalogo y checkout de camisetas

**Branch**: `001-catalogo-checkout` | **Date**: 2026-09-16 | **Spec**: [specs/001-catalogo-checkout/spec.md](../spec.md)

**Input**: Feature specification from `/specs/001-catalogo-checkout/spec.md`

## Summary

Esta feature entrega un e-commerce de camisetas de fútbol con catálogo, búsqueda, variantes, carrito, checkout para invitado o usuario, pago manual, pedidos con estados controlados y administración de catálogo e inventario. El enfoque técnico se basa en un frontend Angular con Tailwind, un backend Express con TypeScript y una base PostgreSQL local, con validación real en backend para stock, precios históricos, estados y permisos.

## Technical Context

**Language/Version**: TypeScript across stack; Node.js 20 LTS for backend; Angular frontend app with Tailwind CSS

**Primary Dependencies**: Angular, Tailwind CSS, Express, PostgreSQL, TypeScript, plus backend validation and transactional database access

**Storage**: PostgreSQL local for products, variants, cart, orders, payments, and admin authorization data

**Testing**: Backend unit/integration tests and frontend component/integration checks; contract validation for checkout and order flows

**Target Platform**: Web application for desktop and mobile browsers

**Project Type**: web-application

**Performance Goals**: search results visible within 2 seconds for matching catalogs; checkout confirmation within 3 minutes under available stock conditions

**Constraints**: no negative stock, historical prices must remain immutable in orders, guest checkout allowed, admin authorization separate from simple authentication, manual payment confirmation with idempotence

**Scale/Scope**: storefront feature with catalog, search, cart, checkout, order tracking, payment handling, and basic admin inventory management

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Status: PASS

- Catálogo exclusivo de fútbol: cumplido por el alcance del producto y las entidades de catálogo.
- Inventario sin sobreventa: validación de stock en checkout y reserva atómica encaja con la especificación y la constitución.
- Precios históricos: el diseño preserva snapshots de precio por variante y linea de pedido.
- Carritos y pedidos válidos: se permite checkout como invitado, con manejo de permisos por usuario y validación de cantidades.
- Estados de pedido controlados: transiciones restringidas y cancelación limitada a estados permitidos.
- Seguridad y autorización: se separan autenticación y permisos administrativos, y no se almacenan contraseñas en texto plano.
- Integridad transaccional: se prevé confirmación del pedido y descuento de inventario como operación consistente.
- Integridad comercial y fuente de verdad: backend es la fuente de verdad para stock, precios, autorización y total.

No hay violaciones a justificar con exenciones.

## Project Structure

### Documentation (this feature)

```text
specs/001-catalogo-checkout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── spec.md              # Feature specification
└── tasks.md             # Future phase output; not created in this step
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── app/
├── public/
└── tests/

backend/
├── src/
│   ├── api/
│   ├── services/
│   ├── validators/
│   ├── models/
│   └── config/
├── tests/
└── package.json

db/
├── migrations/
├── seeds/
├── schema/
└── scripts/
```

**Structure Decision**: web application with root-level frontend, backend, and db directories as required by the constitution, keeping the feature implementation separate from the design artifacts inside the feature spec folder.

## Complexity Tracking

No constitution violations require exceptions or greater scope than the approved product rules.
