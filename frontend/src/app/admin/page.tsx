import React, { useEffect, useState } from "react";
import { api, paymentMethodLabel, type Product } from "../../api";

const categories = [
  "ALL",
  "RETROS",
  "ACTUALES",
  "SELECCIONES",
  "FEMENINO",
  "NINOS",
];

export function AdminPage({ onLogout }: { onLogout: () => void }) {
  const [section, setSection] = useState("inventory");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    category: "ALL",
    availabilityType: "ALL",
  });
  const load = {
    products: () =>
      api.adminProducts(filters).then((r) => setProducts(r.items)),
    orders: () => api.adminOrders().then((r) => setOrders(r.items)),
    payments: () => api.adminPayments().then((r) => setPayments(r.items)),
    users: () => api.adminUsers().then((r) => setUsers(r.items)),
  };
  useEffect(() => {
    if (section === "inventory") void load.products();
  }, [section, filters]);
  useEffect(() => {
    if (section === "orders") {
      void load.orders();
      void load.users();
    }
  }, [section]);
  useEffect(() => {
    if (section === "payments") void load.payments();
  }, [section]);
  useEffect(() => {
    if (section === "users") void load.users();
  }, [section]);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);
  const fail = (error: Error) => setMessage(error.message);
  return (
    <section className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex w-full flex-col bg-[#0c1715] p-4 text-white md:sticky md:top-0 md:h-screen md:w-60">
        <strong className="mb-5 text-amber-300">Administración</strong>
        {[
          ["inventory", "Inventario"],
          ["orders", "Pedidos"],
          ["payments", "Pagos"],
          ["users", "Usuarios"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`mb-2 rounded p-2 text-left ${section === id ? "bg-amber-400 text-black" : ""}`}
          >
            {label}
          </button>
        ))}
        <button onClick={onLogout} className="mt-auto p-2 text-left">
          Salir
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-8">
        {message && <p className="mb-4 rounded bg-amber-50 p-3">{message}</p>}
        {section === "inventory" && (
          <Inventory
            products={products}
            reload={load.products}
            setMessage={setMessage}
            filters={filters}
            setFilters={setFilters}
          />
        )}
        {section === "orders" && (
          <Orders
            orders={orders}
            users={users}
            reload={load.orders}
            fail={fail}
          />
        )}
        {section === "payments" && (
          <Payments payments={payments} reload={load.payments} fail={fail} />
        )}
        {section === "users" && (
          <Users users={users} reload={load.users} setMessage={setMessage} />
        )}
      </main>
    </section>
  );
}

function Confirm({
  title,
  action,
  close,
}: {
  title: string;
  action: () => Promise<void>;
  close: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded bg-white p-5">
        <strong>{title}</strong>
        <p className="mt-2">¿Confirmas esta acción?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={close}
            disabled={busy}
            className="rounded border p-2"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              setBusy(true);
              action().finally(() => {
                setBusy(false);
                close();
              });
            }}
            disabled={busy}
            className="rounded bg-slate-900 p-2 text-white"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
function Status({ value, options, title, onConfirm }: any) {
  const [next, setNext] = useState<string | null>(null);
  return (
    <>
      {next && (
        <Confirm
          title={title}
          action={() => onConfirm(next)}
          close={() => setNext(null)}
        />
      )}
      <select
        value={value}
        onChange={(e) => setNext(e.target.value)}
        className="rounded border p-1"
      >
        {options.map((option: string) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </>
  );
}

function Inventory({ products, reload, setMessage, filters, setFilters }: any) {
  const [show, setShow] = useState(false);
  const [pendingVariant, setPendingVariant] = useState<{
    id: string;
    isActive: boolean;
  } | null>(null);
  const updateVariant = (id: string, payload: any) => {
    const action = () =>
      api.updateAdminVariant(id, payload).then(reload).catch(setMessage);
    if (payload.isActive === undefined) void action();
    else setPendingVariant({ id, isActive: payload.isActive });
  };
  return (
    <>
      <div className="mb-5 flex justify-between">
        <h1 className="text-3xl font-bold">Inventario y catálogo</h1>
        <button
          onClick={() => setShow(!show)}
          className="rounded bg-slate-900 p-2 text-white"
        >
          {show ? "Cerrar" : "Crear producto"}
        </button>
      </div>
      {show && (
        <ProductForm
          saved={() => {
            setShow(false);
            reload();
          }}
          setMessage={setMessage}
        />
      )}
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <label>
          Buscar
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="mt-1 w-full rounded border p-2"
          />
        </label>
        <label>
          Categoría
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="mt-1 w-full rounded border p-2"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          Envío
          <select
            value={filters.availabilityType}
            onChange={(e) =>
              setFilters({ ...filters, availabilityType: e.target.value })
            }
            className="mt-1 w-full rounded border p-2"
          >
            <option>ALL</option>
            <option>IMMEDIATE</option>
            <option>MADE_TO_ORDER</option>
          </select>
        </label>
      </div>
      {products.map((product) => (
        <article key={product.id} className="mb-4 rounded border bg-white p-4">
          <h2 className="font-bold">{product.name}</h2>
          {product.variants.map((variant) => (
            <div
              key={`${product.id}-${variant.id}`}
              className="grid gap-3 border-t py-3 sm:grid-cols-4"
            >
              <span>
                {variant.sku}
                <small className="block">
                  {Object.values(variant.attributes)
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </span>
              <label>
                Precio
                <input
                  type="number"
                  defaultValue={variant.price}
                  onBlur={(event) =>
                    updateVariant(variant.id, {
                      price: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded border p-1"
                />
              </label>
              <label>
                Stock
                <input
                  type="number"
                  defaultValue={variant.stock}
                  onBlur={(event) =>
                    updateVariant(variant.id, {
                      stock: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded border p-1"
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={variant.isActive}
                  onChange={(event) =>
                    updateVariant(variant.id, {
                      isActive: event.target.checked,
                    })
                  }
                />{" "}
                Activa
              </label>
            </div>
          ))}
        </article>
      ))}
      {pendingVariant && (
        <Confirm
          title="Actualizar variante"
          action={() =>
            api
              .updateAdminVariant(pendingVariant.id, {
                isActive: pendingVariant.isActive,
              })
              .then(reload)
              .catch(setMessage)
          }
          close={() => setPendingVariant(null)}
        />
      )}
    </>
  );
}

function ProductForm({ saved, setMessage }: any) {
  const [form, setForm] = useState<any>({
    name: "",
    slug: "",
    description: "",
    category: "ACTUALES",
    availabilityType: "IMMEDIATE",
    price: "",
    stock: "",
    attributes: {
      size: "",
      version: "",
      "long-sleeves": false,
      tournament: "",
      dorsal: "",
    },
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const attributes = Object.fromEntries(
      Object.entries(form.attributes).filter(
        ([key, value]) => key === "long-sleeves" || String(value).trim(),
      ),
    );
    api
      .createAdminProduct({
        name: form.name,
        slug: form.slug,
        description: form.description,
        category: form.category,
        availabilityType: form.availabilityType,
        variants: [
          {
            attributes,
            price: Number(form.price),
            stock: Number(form.stock),
          },
        ],
      })
      .then(saved)
      .catch((error: Error) => setMessage(error.message));
  };
  return (
    <form
      onSubmit={submit}
      className="mb-5 grid gap-3 rounded bg-amber-50 p-4 md:grid-cols-2"
    >
      <h2 className="font-bold md:col-span-2">Crear producto y variante</h2>
      <label>
        Nombre
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <label>
        Slug
        <input
          required
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <label className="md:col-span-2">
        Descripción
        <textarea
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <label>
        Categoría
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="mt-1 w-full rounded border p-2"
        >
          {categories.slice(1).map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <label>
        Disponibilidad
        <select
          value={form.availabilityType}
          onChange={(e) =>
            setForm({ ...form, availabilityType: e.target.value })
          }
          className="mt-1 w-full rounded border p-2"
        >
          <option>IMMEDIATE</option>
          <option>MADE_TO_ORDER</option>
        </select>
      </label>
      <label>
        Precio
        <input
          required
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <label>
        Stock
        <input
          required
          type="number"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <fieldset className="grid gap-3 md:col-span-2 md:grid-cols-2">
        <legend className="font-semibold">Atributos de la variante</legend>
        <label>
          Talla
          <input
            value={form.attributes.size}
            onChange={(e) =>
              setForm({
                ...form,
                attributes: { ...form.attributes, size: e.target.value },
              })
            }
            className="mt-1 w-full rounded border p-2"
          />
        </label>
        <label>
          Versión
          <input
            value={form.attributes.version}
            onChange={(e) =>
              setForm({
                ...form,
                attributes: { ...form.attributes, version: e.target.value },
              })
            }
            className="mt-1 w-full rounded border p-2"
          />
        </label>
        <label>
          Torneo
          <input
            value={form.attributes.tournament}
            onChange={(e) =>
              setForm({
                ...form,
                attributes: { ...form.attributes, tournament: e.target.value },
              })
            }
            className="mt-1 w-full rounded border p-2"
          />
        </label>
        <label>
          Dorsal
          <input
            value={form.attributes.dorsal}
            onChange={(e) =>
              setForm({
                ...form,
                attributes: { ...form.attributes, dorsal: e.target.value },
              })
            }
            className="mt-1 w-full rounded border p-2"
          />
        </label>
        <label className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            checked={form.attributes["long-sleeves"]}
            onChange={(e) =>
              setForm({
                ...form,
                attributes: {
                  ...form.attributes,
                  "long-sleeves": e.target.checked,
                },
              })
            }
          />
          Mangas largas
        </label>
      </fieldset>
      <button className="rounded bg-slate-900 p-2 text-white md:col-span-2">
        Guardar
      </button>
    </form>
  );
}

function Orders({ orders, users, reload, fail }: any) {
  const [form, setForm] = useState<any>(null);
  const [confirm, setConfirm] = useState<(() => Promise<void>) | null>(null);
  return (
    <>
      <div className="mb-5 flex justify-between">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <button
          onClick={() => setForm({})}
          className="rounded bg-slate-900 p-2 text-white"
        >
          Crear pedido
        </button>
      </div>
      {form && (
        <OrderForm
          order={form}
          users={users}
          saved={() => {
            setForm(null);
            reload();
          }}
          close={() => setForm(null)}
          fail={fail}
        />
      )}
      <div className="overflow-x-auto rounded border bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4">Fecha de creación</th>
              <th className="p-4">Total</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-b-0">
                <td className="p-4">{order.id}</td>
                <td className="p-4">
                  {order.userName ?? order.email ?? "Invitado"}
                </td>
                <td className="p-4">{order.customerPhone ?? "-"}</td>
                <td className="p-4">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString("es-CO")
                    : "-"}
                </td>
                <td className="p-4">${order.total}</td>
                <td className="p-4">
                  <Status
                    value={order.status}
                    options={[
                      "PENDIENTE",
                      "EN_PREPARACION",
                      "ENVIADO",
                      "ENTREGADO",
                      "CANCELADO",
                    ]}
                    title="Actualizar pedido"
                    onConfirm={(status) =>
                      api
                        .updateAdminOrderStatus(order.id, status)
                        .then(reload)
                        .catch(fail)
                    }
                  />
                </td>
                <td className="p-4">
                  <button
                    onClick={() =>
                      setConfirm(() =>
                        api.deleteAdminOrder(order.id).then(reload),
                      )
                    }
                    className="text-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirm && (
        <Confirm
          title="Eliminar pedido"
          action={confirm}
          close={() => setConfirm(null)}
        />
      )}
    </>
  );
}
function OrderForm({ order, users, saved, close, fail }: any) {
  const [form, setForm] = useState<any>({
    userLegacyId: order.userId ?? "",
    userSearch: order.userName
      ? `${order.userName}${order.email ? ` - ${order.email}` : ""}`
      : "",
    total: "",
    customerPhone: "",
    notes: "",
    paymentMethod: "CASH_ON_DELIVERY",
    ...order,
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const request = order.id
      ? api.updateAdminOrder(order.id, {
          customerPhone: form.customerPhone,
          paymentMethod: form.paymentMethod,
        })
      : api.createAdminOrder({
          userLegacyId: form.userLegacyId || undefined,
          customerPhone: form.customerPhone,
          notes: form.notes,
          total: Number(form.total),
          paymentMethod: form.paymentMethod,
        });
    request.then(saved).catch(fail);
  };
  return (
    <form
      onSubmit={submit}
      className="mb-5 grid gap-3 rounded bg-slate-50 p-4 md:grid-cols-2"
    >
      <h2 className="font-bold md:col-span-2">
        {order.id ? "Editar pedido" : "Crear pedido"}
      </h2>
      <label>
        Usuario
        <input
          list="admin-order-users"
          value={form.userSearch}
          onChange={(e) => {
            const userSearch = e.target.value;
            const selectedUser = users.find(
              (user: any) =>
                `${user.name} - ${user.email}` === userSearch,
            );
            setForm({
              ...form,
              userSearch,
              userLegacyId: selectedUser?.id ?? "",
            });
          }}
          placeholder="Buscar por nombre o correo"
          className="mt-1 w-full rounded border p-2"
        />
        <datalist id="admin-order-users">
          {users.map((user: any) => (
            <option key={user.id} value={`${user.name} - ${user.email}`}>
            </option>
          ))}
        </datalist>
      </label>
      <label>
        Total
        <input
          required={!order.id}
          type="number"
          min="0.01"
          value={form.total}
          onChange={(e) => setForm({ ...form, total: e.target.value })}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <label>
        Teléfono del cliente
        <input
          value={form.customerPhone}
          onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <label>
        Método de pago
        <select
          value={form.paymentMethod}
          onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
          className="mt-1 w-full rounded border p-2"
        >
          <option value="CASH_ON_DELIVERY">Efectivo contraentrega</option>
          <option value="WHATSAPP_TRANSFER">Transferencia</option>
        </select>
      </label>
      <label className="md:col-span-2">
        Notas (opcional)
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <button className="rounded bg-slate-900 p-2 text-white">Guardar</button>
      <button type="button" onClick={close} className="rounded border p-2">
        Cerrar
      </button>
    </form>
  );
};

function Payments({ payments, reload, fail }: any) {
  return (
    <>
      <h1 className="mb-5 text-3xl font-bold">Pagos</h1>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full min-w-[460px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4">Pedido</th>
              <th className="p-4">Método</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment: any) => (
              <tr key={payment.id} className="border-b last:border-b-0">
                <td className="p-4">{payment.orderId}</td>
                <td className="p-4">{paymentMethodLabel(payment.method)}</td>
                <td className="p-4">
                  <Status
                    value={payment.status}
                    options={[
                      "PENDIENTE",
                      "CONFIRMADO",
                      "RECHAZADO",
                      "EXPIRADO",
                      "CANCELADO",
                    ]}
                    title="Actualizar pago"
                    onConfirm={(status) =>
                      api
                        .updateAdminPaymentStatus(payment.id, status)
                        .then(reload)
                        .catch(fail)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Users({ users, reload, setMessage }: any) {
  const [showForm, setShowForm] = useState(false);
  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded bg-slate-900 p-2 text-white"
        >
          {showForm ? "Cerrar" : "Crear usuario"}
        </button>
      </div>
      {showForm && (
        <UserForm
          saved={() => {
            setShowForm(false);
            reload();
          }}
          setMessage={setMessage}
        />
      )}
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Correo</th>
              <th className="p-4">Dirección</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id} className="border-b last:border-b-0">
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.address || "-"}</td>
                <td className="p-4">{user.role}</td>
                <td className="p-4">
                  {user.isActive ? "Activo" : "Inactivo"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

function UserForm({ saved, setMessage }: any) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
    role: "CUSTOMER",
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    api
      .createAdminUser(form)
      .then(saved)
      .catch((error: Error) => setMessage(error.message));
  };
  return (
    <form
      onSubmit={submit}
      className="mb-5 grid gap-3 rounded bg-slate-50 p-4 md:grid-cols-2"
    >
      <h2 className="font-bold md:col-span-2">Crear usuario</h2>
      <label>
        Nombre
        <input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <label>
        Correo
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <label>
        Contraseña
        <input
          required
          minLength={8}
          type="password"
          value={form.password}
          onChange={(event) =>
            setForm({ ...form, password: event.target.value })
          }
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <label>
        Rol
        <select
          value={form.role}
          onChange={(event) => setForm({ ...form, role: event.target.value })}
          className="mt-1 w-full rounded border p-2"
        >
          <option value="CUSTOMER">Cliente</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </label>
      <label className="md:col-span-2">
        Dirección
        <input
          value={form.address}
          onChange={(event) =>
            setForm({ ...form, address: event.target.value })
          }
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <button className="rounded bg-slate-900 p-2 text-white md:col-span-2">
        Guardar usuario
      </button>
    </form>
  );
}
