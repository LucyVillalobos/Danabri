//const BASE = "http://localhost:3001/api";
const BASE = "/danabri_backend/api";

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

export async function crearVenta({ id_usuario, id_almacen, metodo_pago, items, pagos, monto_pagado }) {
  const res = await fetch(`${BASE}/ventas`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_usuario, id_almacen, metodo_pago, items, pagos, monto_pagado }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al registrar venta");
  }
  return res.json();
}
// ── Ventas por folio (para devoluciones / reimpresión) ──────
export async function getVentaPorFolio(folio) {
  const res = await fetch(`${BASE}/ventas/folio/${encodeURIComponent(folio)}`);
  if (!res.ok) throw new Error("Ticket no encontrado");
  return res.json();
}

// ── Devoluciones ────────────────────────────────────────────
export async function crearDevolucion({ folio_original, items, tipo, id_caja, id_usuario }) {
  const res = await fetch(`${BASE}/devoluciones`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folio_original, items, tipo, id_caja, id_usuario }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al registrar devolución"); }
  return res.json();
}

// ── Cortes de caja ──────────────────────────────────────────
export async function getCorteData(id_caja) {
  const res = await fetch(`${BASE}/caja/${id_caja}/corte`);
  if (!res.ok) throw new Error("Error al cargar datos de corte");
  return res.json();
}

export async function registrarCorte({ id_caja, tipo, id_usuario, datos }) {
  const res = await fetch(`${BASE}/caja/${id_caja}/corte`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, id_usuario, datos }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al registrar corte"); }
  return res.json();
}

// ── Salidas de efectivo ─────────────────────────────────────
export async function getSalidasEfectivo() {
  const res = await fetch(`${BASE}/caja/salidas`);
  if (!res.ok) throw new Error("Error al cargar salidas");
  return res.json();
}

export async function registrarSalidaEfectivo({ id_caja, id_usuario, concepto, monto, requiere_autorizacion }) {
  const res = await fetch(`${BASE}/caja/salidas`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_caja, id_usuario, concepto, monto, requiere_autorizacion }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al registrar salida"); }
  return res.json();
}

// ── Descuentos ──────────────────────────────────────────────
export async function getDescuentosActivos() {
  const res = await fetch(`${BASE}/descuentos/activos`);
  if (!res.ok) throw new Error("Error al cargar descuentos");
  return res.json();
}

// ── Facturas ────────────────────────────────────────────────
export async function getVentasPorFolios(folios) {
  const params = folios.map(f => `folio=${encodeURIComponent(f)}`).join("&");
  const res = await fetch(`${BASE}/ventas/por-folios?${params}`);
  if (!res.ok) throw new Error("Error al cargar ventas");
  return res.json();
}

export async function crearFactura({ folios, id_cliente, rfc, nombre_fiscal, uso_cfdi, metodo_pago_sat, forma_pago_sat, notas }) {
  const res = await fetch(`${BASE}/facturas`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folios, id_cliente, rfc, nombre_fiscal, uso_cfdi, metodo_pago_sat, forma_pago_sat, notas }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al crear factura"); }
  return res.json();
}

// ── Usuarios ────────────────────────────────────────────────
export async function getUsuarios() {
  const res = await fetch(`${BASE}/usuarios`);
  if (!res.ok) throw new Error("Error al cargar usuarios");
  return res.json();
}

// ── Clientes CRUD ────────────────────────────────────────────
export async function crearCliente(data) {
  const res = await fetch(`${BASE}/clientes`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al crear cliente"); }
  return res.json();
}

export async function actualizarCliente(id, data) {
  const res = await fetch(`${BASE}/clientes/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al actualizar cliente"); }
  return res.json();
}

export async function getHistorialCliente(id) {
  const res = await fetch(`${BASE}/clientes/${id}/historial`);
  if (!res.ok) throw new Error("Error al cargar historial");
  return res.json();
}

// ── Remisiones ───────────────────────────────────────────────
export async function getRemisiones(filtros = {}) {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${BASE}/remisiones?${params}`);
  if (!res.ok) throw new Error("Error al cargar remisiones");
  return res.json();
}

export async function getRemision(id) {
  const res = await fetch(`${BASE}/remisiones/${id}`);
  if (!res.ok) throw new Error("Error al cargar remisión");
  return res.json();
}

export async function actualizarRemision(id, data) {
  const res = await fetch(`${BASE}/remisiones/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al actualizar remisión"); }
  return res.json();
}

// ── Cotizaciones ─────────────────────────────────────────────
export async function getCotizaciones(filtros = {}) {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${BASE}/cotizaciones?${params}`);
  if (!res.ok) throw new Error("Error al cargar cotizaciones");
  return res.json();
}

export async function crearCotizacion(data) {
  const res = await fetch(`${BASE}/cotizaciones`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al crear cotización"); }
  return res.json();
}

export async function convertirCotizacionARemision(id) {
  const res = await fetch(`${BASE}/cotizaciones/${id}/convertir`, { method: "POST" });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al convertir"); }
  return res.json();
}

// ── Perfiles de caja ─────────────────────────────────────────
export async function getPerfilesCaja() {
  const res = await fetch(`${BASE}/caja/perfiles`);
  if (!res.ok) throw new Error("Error al cargar perfiles");
  return res.json();
}

export async function crearPerfilCaja(data) {
  const res = await fetch(`${BASE}/caja/perfiles`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al crear perfil"); }
  return res.json();
}

export async function actualizarPerfilCaja(id, data) {
  const res = await fetch(`${BASE}/caja/perfiles/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al actualizar perfil"); }
  return res.json();
}

export async function eliminarPerfilCaja(id) {
  const res = await fetch(`${BASE}/caja/perfiles/${id}`, { method: "DELETE" });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al eliminar perfil"); }
  return res.json();
}

// ── Apertura / Retiro / Turno ─────────────────────────────
export async function registrarAperturaCaja({ id_caja, id_usuario, fondo }) {
  const res = await fetch(`${BASE}/caja/apertura`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_caja, id_usuario, fondo }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error"); }
  return res.json();
}

export async function registrarRetiro({ id_caja, id_usuario, monto, denominaciones, concepto }) {
  const res = await fetch(`${BASE}/caja/retiro`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_caja, id_usuario, monto, denominaciones, concepto }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error"); }
  return res.json();
}

export async function registrarCambioTurno({ id_caja, id_usuario_saliente, id_usuario_entrante, denominaciones, total_contado, excedente }) {
  const res = await fetch(`${BASE}/caja/cambio-turno`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_caja, id_usuario_saliente, id_usuario_entrante, denominaciones, total_contado, excedente }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error"); }
  return res.json();
}

export async function getRutas(filtros = {}) {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${BASE}/rutas?${params}`);
  if (!res.ok) throw new Error("Error al cargar rutas");
  return res.json();
}

export async function crearRuta(data) {
  const res = await fetch(`${BASE}/rutas`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al crear ruta"); }
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────
export async function login({ email, password }) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Credenciales incorrectas"); }
  return res.json(); // { id_usuario, nombre, email, rol }
}

export async function verificarPassword({ id_usuario, password }) {
  const res = await fetch(`${BASE}/auth/verificar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_usuario, password }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Contraseña incorrecta"); }
  return res.json();
}
