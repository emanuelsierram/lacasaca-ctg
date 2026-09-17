# Tasks: Catalogo y checkout de camisetas

**Input**: Design documents from `/specs/001-catalogo-checkout/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and delivered independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: `US1`..`US5`, mapping to the user stories from spec.md
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the project structure and shared configuration for the storefront stack.

- [ ] T001 Create repository structure for the storefront: `frontend/`, `backend/`, and `db/` with initial directories and package manifests
- [ ] T002 Initialize `backend/` with TypeScript, Express, and required runtime dependencies for API routes, validation, and database access
- [ ] T003 [P] Initialize `frontend/` with Angular and Tailwind CSS and required app shell dependencies
- [ ] T004 [P] Configure shared environment variables and configuration files in `backend/src/config/` and `frontend/src/environments/`
- [ ] T005 [P] Configure linting and formatting rules for TypeScript in `backend/` and `frontend/`
- [ ] T006 Create feature documentation index and ensure the repository references `specs/001-catalogo-checkout/` design artifacts correctly

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the domain foundation, API conventions, auth skeleton, and database schema required before any story implementation.

**Critical**: No user story work may begin until this phase is complete.

- [ ] T007 Define shared backend domain types and enums for product categories, order states, payment methods, and payment status in `backend/src/models/domain-types.ts`
- [ ] T008 Create PostgreSQL schema and migration scaffolding for `products`, `variants`, `categories`, `users`, `carts`, `cart_items`, `orders`, `order_items`, `payments`, and admin authorization tables in `db/migrations/`
- [ ] T009 [P] Implement DB connection layer and repository interfaces in `backend/src/config/database.ts` and `backend/src/repositories/`
- [ ] T010 [P] Implement centralized error handling and HTTP response mapping in `backend/src/api/error-handler.ts` and `backend/src/api/http.ts`
- [ ] T011 Implement auth/session bootstrap and role checks for customer vs admin in `backend/src/services/auth.service.ts` and `backend/src/middleware/auth.ts`
- [ ] T012 [P] Implement inventory validation service and stock guard logic in `backend/src/services/inventory.service.ts` using the rule: "stock de cada variante nunca puede ser negativo" and "checkout debe validar stock real y cantidades antes de crear el pedido"
- [ ] T013 Implement pricing and order snapshot logic in `backend/src/services/pricing.service.ts` to preserve historical unit prices and recalculate totals in the backend
- [ ] T014 Implement base API routing and middleware composition for catalog, cart, checkout, and order endpoints in `backend/src/api/routes/`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Comprar una camiseta (Priority: P1) 🎯 MVP

**Goal**: Deliver the catalog, variant selection, and checkout flow that allows a buyer to add a valid variant to cart and create a real order with validated stock and pricing.

**Independent Test**: Given a product and variant with stock, a user can select the variant, add it to cart, confirm checkout, and receive a valid order with historical totals and stock deduction.

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create product and variant domain models in `backend/src/models/product.model.ts` and `backend/src/models/variant.model.ts` with fields required by `spec.md` and `data-model.md` including `name`, `description`, `categoryId`, `price`, `stock`, `isActive`, and `availabilityType`
- [ ] T016 [P] [US1] Create catalog repository and product query methods in `backend/src/repositories/product.repository.ts` and `backend/src/repositories/variant.repository.ts`
- [ ] T017 [US1] Implement catalog service in `backend/src/services/catalog.service.ts` to list products, search by name, filter by category, and expose active variants only
- [ ] T018 [US1] Implement catalog endpoints in `backend/src/api/routes/catalog.routes.ts` for `GET /api/catalog/products` and `GET /api/catalog/products/:id`
- [ ] T019 [P] [US1] Create frontend catalog page and product cards in `frontend/src/app/catalog/` with category filter controls, search input, and product cards that show name, image, price, availability, and variant information
- [ ] T020 [P] [US1] Create product detail page in `frontend/src/app/product/` showing images, description, variant selector, and unavailable/stock-zero states
- [ ] T021 [US1] Implement cart domain and persistence layer in `backend/src/models/cart.model.ts`, `backend/src/models/cart-item.model.ts`, and `backend/src/repositories/cart.repository.ts`
- [ ] T022 [US1] Implement cart service in `backend/src/services/cart.service.ts` to add, update, remove, and read cart items while validating integer quantities and active variants
- [ ] T023 [US1] Implement cart endpoints in `backend/src/api/routes/cart.routes.ts` for `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:id`, and `DELETE /api/cart/items/:id`
- [ ] T024 [P] [US1] Create cart UI in `frontend/src/app/cart/` with product, variant, quantity, subtotal, and total display
- [ ] T025 [US1] Implement checkout service in `backend/src/services/checkout.service.ts` to validate cart, recalculate totals, reserve inventory atomically, create orders, and persist `OrderItem` historical snapshots before order completion
- [ ] T026 [US1] Implement checkout endpoint in `backend/src/api/routes/checkout.routes.ts` for `POST /api/checkout` and enforce the rule: "El total del pedido DEBE calcularse a partir de cantidades, precios, descuentos, envio y demas conceptos aplicables; el cliente NO PUEDE proporcionar ni modificar el total final"
- [ ] T027 [P] [US1] Create checkout form in `frontend/src/app/checkout/` with payment-method selection, guest checkout flow, and validation messaging for unavailable stock and invalid quantities

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Encontrar productos y revisar stock (Priority: P1)

**Goal**: Provide product discovery, category filtering, search, and clear stock indicators for a customer browsing the catalog.

**Independent Test**: Given a set of products across categories, a shopper can filter by category, search by name, and identify variants in stock vs out of stock without confusion.

### Implementation for User Story 2

- [ ] T028 [P] [US2] Extend catalog data and repository support for `category` enumeration and product search filtering in `backend/src/repositories/product.repository.ts`
- [ ] T029 [US2] Implement category and search validation service logic in `backend/src/services/catalog.service.ts` to ensure `RETROS`, `ACTUALES`, `SELECCIONES`, `FEMENINO`, and `NINOS` are handled correctly and empty queries return a clear not-found result
- [ ] T030 [P] [US2] Add frontend search and category filter components in `frontend/src/app/catalog/` and `frontend/src/components/` to support live filtering and empty-state messaging
- [ ] T031 [US2] Add variant availability labels and stock badges in `frontend/src/components/product-card/` and `frontend/src/components/product-detail/` so product cards render "agotada" or "disponible" based on stock and active state
- [ ] T032 [P] [US2] Implement product detail view logic to switch price based on selected variant and show correct availability state in `frontend/src/app/product/`
- [ ] T033 [US2] Add backend validation for inactive products and inactive variants in `backend/src/services/catalog.service.ts` and `backend/src/services/checkout.service.ts` to satisfy "productos y variantes desactivados NO DEBEN estar disponibles para nuevas compras"

**Checkpoint**: At this point, User Story 1 and User Story 2 should both work independently.

---

## Phase 5: User Story 3 - Gestionar cuenta y pedidos propios (Priority: P2)

**Goal**: Allow account creation, login/logout, guest checkout, and personalized order history restricted to the authenticated owner.

**Independent Test**: A user can register with a unique email, sign in, view only their own order history, and complete a guest checkout without prior authentication.

### Implementation for User Story 3

- [ ] T034 [P] [US3] Create user model and auth persistence layer in `backend/src/models/user.model.ts` and `backend/src/repositories/user.repository.ts` with `email` uniqueness and password hashing requirements
- [ ] T035 [US3] Implement registration, login, and logout services in `backend/src/services/user.service.ts` and `backend/src/services/auth.service.ts` to enforce secure password handling and session validity
- [ ] T036 [US3] Implement authentication routes in `backend/src/api/routes/auth.routes.ts` for account creation and login, including hashed storage and unauthorized access enforcement
- [ ] T037 [US3] Implement order ownership and access control in `backend/src/services/order.service.ts` so authenticated users can only read their own orders and never another user’s records
- [ ] T038 [US3] Implement order retrieval endpoints in `backend/src/api/routes/order.routes.ts` for `GET /api/orders/me` and `GET /api/orders/:id`, respecting `FR-025` and `FR-026`
- [ ] T039 [P] [US3] Build account UI in `frontend/src/app/auth/` for sign up, sign in, sign out, and protected access to personal order history
- [ ] T040 [P] [US3] Build personal orders page in `frontend/src/app/orders/` to show order list and details using the authenticated user’s own records only
- [ ] T041 [US3] Update guest checkout flow so a buyer can create and confirm an order without prior sign-in while keeping authenticated-only screens protected

**Checkpoint**: At this point, the account and personal-order flows should be independently functional.

---

## Phase 6: User Story 4 - Administrar catalogo e inventario (Priority: P2)

**Goal**: Enable authorized administrators to maintain products, variants, prices, and stock without changing historical order data.

**Independent Test**: An admin can add or update a product and variant, adjust stock/price, and reject similar changes from a non-admin user; historical order snapshots remain immutable.

### Implementation for User Story 4

- [ ] T042 [P] [US4] Create admin catalog and inventory models in `backend/src/models/product.model.ts`, `backend/src/models/variant.model.ts`, and `backend/src/repositories/admin.repository.ts` with support for active/inactive states and price adjustments
- [ ] T043 [US4] Implement admin product and variant management service in `backend/src/services/admin.catalog.service.ts` to create, update, deactivate, and adjust inventory while preserving historical order data
- [ ] T044 [US4] Implement admin authorization checks in `backend/src/middleware/admin-auth.ts` and `backend/src/services/auth.service.ts` so only authorized admins may update catalog and inventory
- [ ] T045 [US4] Add admin catalog/inventory endpoints in `backend/src/api/routes/admin.routes.ts` for CRUD of products, variants, prices, and stock updates
- [ ] T046 [P] [US4] Build admin dashboard UI in `frontend/src/app/admin/` for product, variant, price, and inventory management actions
- [ ] T047 [US4] Ensure historical order snapshots remain unchanged when catalog prices change by persisting `unitPriceSnapshot` and `subtotal` values on every order item in `backend/src/services/checkout.service.ts` and `backend/src/services/order.service.ts`
- [ ] T048 [US4] Add validation to reject disallowed admin actions from non-admin users and to block purchase access for inactive products and variants

**Checkpoint**: At this point, catalog management and authorization should be independently testable.

---

## Phase 7: User Story 5 - Gestionar estados y cancelacion (Priority: P3)

**Goal**: Manage order lifecycle, payment confirmation, cancellation restrictions, and inventory restitution according to business state rules.

**Independent Test**: A buyer can request cancellation only from `PENDIENTE` or `EN_PREPARACION`, admin users can advance the status flow, and inventory is restored according to failed or expired manual payment rules.

### Implementation for User Story 5

- [ ] T049 [P] [US5] Create order and payment models in `backend/src/models/order.model.ts`, `backend/src/models/order-item.model.ts`, and `backend/src/models/payment.model.ts` with enums for `PENDIENTE`, `EN_PREPARACION`, `ENVIADO`, `ENTREGADO`, `CANCELADO` and payment statuses
- [ ] T050 [US5] Implement order lifecycle service in `backend/src/services/order.service.ts` to validate transitions, restrict cancellation to allowed states, and prevent reactivation of cancelled orders or reversions from delivered orders
- [ ] T051 [US5] Implement payment handling service in `backend/src/services/payment.service.ts` for manual transfer confirmation, idempotence protection, and rejection of duplicate confirmations
- [ ] T052 [US5] Implement admin status transition endpoint in `backend/src/api/routes/admin.routes.ts` for `PATCH /api/admin/orders/:id/status` and enforce the allowed transitions defined in the data model
- [ ] T053 [US5] Implement payment confirmation and cancellation endpoints in `backend/src/api/routes/admin.routes.ts` and `backend/src/api/routes/order.routes.ts` for WhatsApp transfer confirmation and `POST /api/orders/:id/cancel`
- [ ] T054 [US5] Add inventory restitution logic for failed or expired manual payments in `backend/src/services/inventory.service.ts` and payment expiration workflow, ensuring a 24-hour manual payment window and reintegration without negative stock
- [ ] T055 [P] [US5] Build order status and payment UI in `frontend/src/app/orders/` and `frontend/src/app/admin/` to display order state, payment result, and admin actions for approval and status update
- [ ] T056 [US5] Add backend checks for automatic and manual payment states to ensure `paymentStatus` remains `PENDING` until confirmation and `orderStatus` is not marked as paid before a valid confirmation

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Finalize shared quality, validation, and cross-story consistency checks.

- [ ] T057 [P] Review all endpoints and UI flows against the constitution and `spec.md` to ensure no rule is bypassed, including secure password handling, stock rules, historical pricing, and authorization boundaries
- [ ] T058 [P] Review all frontend forms and backend responses to ensure error messages are understandable and do not expose raw stack traces or internal implementation details
- [ ] T059 [P] Run end-to-end validation using the scenarios in `quickstart.md` for catalog browsing, checkout, guest purchase, admin actions, and payment/manual cancellation flows
- [ ] T060 Add final documentation and cross-link references between `spec.md`, `plan.md`, `data-model.md`, `contracts/`, and `quickstart.md` in the feature folder
- [ ] T061 Ensure all tasks and file paths conform to the required checklist format: checkbox, task ID, optional `[P]`, and story labels `[USx]` where required

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies
- **Phase 2 (Foundational)**: depends on Setup completion and blocks all user stories
- **Phase 3+ (User Stories)**: depend on Foundational completion
- **Phase 8 (Polish)**: depends on all desired user stories being complete

### User Story Dependencies

- **US1**: can start after Foundation; independent from other stories
- **US2**: can start after Foundation; depends on catalog primitives but is independently testable
- **US3**: can start after Foundation; depends on auth and order ownership primitives
- **US4**: can start after Foundation; depends on inventory and catalog primitives
- **US5**: can start after Foundation; depends on order, payment, and inventory primitives

### Parallel Opportunities

- Setup tasks T002-T005 can run in parallel
- Foundational tasks T009, T010, T012, and T014 can run in parallel in the backend once shared models are in place
- US1 tasks T015-T020 and T021-T027 can be split across catalog/cart/checkout workstreams
- US2 tasks T028-T033 are parallelizable around catalog and frontend presentation
- US3 tasks T034-T040 can be split between auth, order access, and UI workstreams
- US4 tasks T042-T048 can be split between admin service logic and frontend dashboard work
- US5 tasks T049-T056 can be split between order lifecycle, payment service, and UI workstreams

---

## Parallel Example: Story Execution

```bash
# Example parallel focus after Foundation complete
Task: "Build catalog and product discovery flow for US1 and US2"
Task: "Build auth and personal-order flow for US3"
Task: "Build admin catalog and inventory flow for US4"
Task: "Build order lifecycle and payment flow for US5"
```

---

## Implementation Strategy

### MVP First

1. Complete Setup + Foundational
2. Deliver User Story 1 only
3. Validate the checkout and inventory flow independently
4. Then extend to US2-US5 in priority order

### Incremental Delivery

1. Add catalog and cart flows
2. Add auth and personal order access
3. Add admin inventory and catalog management
4. Add order lifecycle and payment confirmation
5. Run full cross-story validation and polish

---

## Notes

- `[P]` tasks are different-files tasks with no dependency on another unfinished task.
- Story tasks must remain traceable to the user story they implement.
- The final output is intended to be immediately executable by an implementation agent without extra clarification.
- No hidden assumptions are added beyond the approved architecture, requirements, and design artifacts in the feature folder.
