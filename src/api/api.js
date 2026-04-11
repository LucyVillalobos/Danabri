const BASE = "http://localhost:3001/api";

// ── Productos ──────────────────────────────
export async function getProductos() {
  const res = await fetch(`${BASE}/productos`);
  if (!res.ok) throw new Error("Error al cargar productos");
  return res.json();
}

export async function buscarProductos(q) {
  const res = await fetch(`${BASE}/productos/buscar?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Error en búsqueda");
  return res.json();
}

// ── Clientes ───────────────────────────────
export async function getClientes() {
  const res = await fetch(`${BASE}/clientes`);
  if (!res.ok) throw new Error("Error al cargar clientes");
  return res.json();
}

export async function buscarClientes(q) {
  const res = await fetch(`${BASE}/clientes/buscar?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Error en búsqueda de clientes");
  return res.json();
}

// ── Ventas ─────────────────────────────────
export async function getResumenDia() {
  const res = await fetch(`${BASE}/ventas/resumen`);
  if (!res.ok) throw new Error("Error al cargar resumen");
  return res.json();
}

export async function getVentasDia() {
  const res = await fetch(`${BASE}/ventas`);
  if (!res.ok) throw new Error("Error al cargar ventas");
  return res.json();
}

export async function crearVenta({ id_usuario, id_cliente, metodo_pago, items, monto_pagado }) {
  const res = await fetch(`${BASE}/ventas`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_usuario, id_cliente, metodo_pago, items, monto_pagado }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al registrar venta");
  }
  return res.json();
}