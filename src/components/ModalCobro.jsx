import { useState, useEffect } from "react";
import { generarRemisionPDF } from "../utils/generarPDF";
import { useCart } from "./CartContext";
import { getClientes, crearVenta } from "../api/api";
import styles from "./ModalCobro.module.css";

const METODOS = [
  { id: "efectivo",      label: "Efectivo",      emoji: "💵" },
  { id: "tarjeta",       label: "Tarjeta",        emoji: "💳" },
  { id: "transferencia", label: "Transferencia",  emoji: "📱" },
  { id: "cheque",        label: "Cheque",         emoji: "📝" },
  { id: "vale",          label: "Vale",           emoji: "🎫" },
];

const LINK_FACTURACION = "facturacion.danabri.com/factura";

function ModalCobro({ total, subtotal, iva, ahorro = 0, items, onCerrar, onConfirmar }) {
  const {
    registrarVenta = () => {},
    cliente, seleccionarCliente,
    vendedor,
  } = useCart() ?? {};

  const [clientes,  setClientes]  = useState([]);
  const [busqueda,  setBusqueda]  = useState("");
  const [fase,      setFase]      = useState("cobro");
  const [guardando, setGuardando] = useState(false);
  const [folio,     setFolio]     = useState("");
  const [pagos,     setPagos]     = useState([{ metodo_pago: "efectivo", monto: "" }]);

  useEffect(() => {
    getClientes()
      .then((data) => setClientes(Array.isArray(data) ? data : []))
      .catch(() => setClientes([]));
  }, []);

  // Filtrar clientes — acepta id_cliente o id
  const clientesFiltrados = clientes.filter((c) => {
    const nombre = c.nombre || c.name || "";
    return nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  const clienteId = cliente?.id_cliente ?? null;

  const totalPagado   = pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);
  const faltante      = total - totalPagado;
  const cambio        = totalPagado - total;
  const pagoValido    = totalPagado >= total;
  const tieneEfectivo = pagos.some((p) => p.metodo_pago === "efectivo");

  // Calcular descuentos totales aplicados (mayoreo + manual + %)
  const totalDescuentos = items.reduce((a, item) => {
    const base     = item.precio_menudeo ?? item.precio ?? 0;
    const cobrado  = item.precio_unitario ?? base;
    const diff     = (base - cobrado) * item.cantidad;
    return a + (diff > 0 ? diff : 0);
  }, 0);

  const agregarPago    = () => setPagos([...pagos, { metodo_pago: "tarjeta", monto: "" }]);
  const eliminarPago   = (idx) => pagos.length > 1 && setPagos(pagos.filter((_, i) => i !== idx));
  const actualizarPago = (idx, campo, valor) => {
    const n = [...pagos]; n[idx] = { ...n[idx], [campo]: valor }; setPagos(n);
  };

  const confirmar = async () => {
    if (!pagoValido || guardando) return;
    setGuardando(true);
    try {
      const result = await crearVenta({
        id_usuario:  1,
        id_almacen:  1,
        id_cliente:  cliente?.id_cliente ?? null,
        id_vendedor: vendedor?.id || null,
        metodo_pago: pagos[0].metodo_pago,
        items: items.map((item) => ({
          id_presentacion: item.id_presentacion || item.id,
          cantidad:        item.cantidad,
          precio_unitario: item.precio_unitario ?? item.precio_menudeo ?? item.precio,
        })),
        pagos: pagos.map((p) => ({
          metodo_pago: p.metodo_pago,
          monto:       parseFloat(p.monto) || 0,
        })),
        monto_pagado: totalPagado,
      });

      setFolio(result.folio);
      registrarVenta({
        cliente:  cliente?.nombre || "Cliente General",
        vendedor: vendedor?.nombre || "—",
        metodo:   pagos[0].metodo_pago,
        total, subtotal, iva, ahorro: totalDescuentos, items,
        hora: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      });
      setFase("ticket");
    } catch (err) {
      alert("Error al registrar venta: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarTicket = () => { onConfirmar(); onCerrar(); };

  const hora = new Date().toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const totalPiezas = items.reduce((a, i) => a + i.cantidad, 0);

  // Items con descuento detallado para el ticket
  const itemsConDescuento = items.map((item) => {
    const base    = item.precio_menudeo ?? item.precio ?? 0;
    const cobrado = item.precio_unitario ?? base;
    return { ...item, precio_unitario: cobrado, _ahorro: (base - cobrado) * item.cantidad };
  });

  return (
    <div className={styles.overlay} onClick={fase === "cobro" ? onCerrar : undefined}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {fase === "cobro" ? (
          <>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitulo}>Cobrar orden</span>
              <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
            </div>

            {/* ── Cliente ── */}
            <div className={styles.seccion}>
              <label className={styles.label}>Cliente</label>
              <input
                className={styles.clienteSearch}
                type="text"
                placeholder="Buscar cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <div className={styles.clienteLista}>
                {clientesFiltrados.slice(0, 8).map((c) => {
                  const id = c.id_cliente ?? c.id;
                  return (
                    <div
                      key={id}
                      className={`${styles.clienteItem} ${clienteId === id ? styles.clienteItemActivo : ""}`}
                      onClick={() => { seleccionarCliente({ ...c, id_cliente: id }); setBusqueda(""); }}
                    >
                      <div className={styles.clienteAvatar}>{(c.nombre || "?").charAt(0)}</div>
                      <div className={styles.clienteInfo}>
                        <span className={styles.clienteNombre}>{c.nombre}</span>
                        <span className={styles.clienteTipo}>{c.tipo_cliente || c.rfc || "—"}</span>
                      </div>
                      {clienteId === id && <span className={styles.clienteCheck}>✓</span>}
                    </div>
                  );
                })}
                {clientes.length === 0 && (
                  <div className={styles.clienteVacio}>Sin clientes cargados</div>
                )}
              </div>
            </div>

            {/* ── Pagos ── */}
            <div className={styles.seccion}>
              <label className={styles.label}>Pagos</label>
              {pagos.map((pago, idx) => (
                <div key={idx} className={styles.pagoRow}>
                  <div className={styles.metodosMini}>
                    {METODOS.map((m) => (
                      <button
                        key={m.id}
                        className={`${styles.metodoBtnMini} ${pago.metodo_pago === m.id ? styles.metodoBtnActivo : ""}`}
                        onClick={() => actualizarPago(idx, "metodo_pago", m.id)}
                      >
                        {m.emoji} {m.label}
                      </button>
                    ))}
                  </div>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputPrefix}>$</span>
                    <input
                      className={styles.input}
                      type="number"
                      placeholder="0.00"
                      value={pago.monto}
                      onChange={(e) => actualizarPago(idx, "monto", e.target.value)}
                      min={0}
                    />
                    {pagos.length > 1 && (
                      <button className={styles.eliminarPagoBtn} onClick={() => eliminarPago(idx)}>✕</button>
                    )}
                  </div>
                </div>
              ))}

              <button className={styles.agregarPagoBtn} onClick={agregarPago}>
                + Agregar otro método de pago
              </button>

              {totalPagado > 0 && (
                <div className={`${styles.cambio} ${faltante > 0 ? styles.cambioNeg : styles.cambioPos}`}>
                  {faltante > 0
                    ? `Faltan $${faltante.toFixed(2)}`
                    : `${tieneEfectivo ? "Cambio" : "Excedente"}: $${cambio.toFixed(2)}`}
                </div>
              )}
            </div>

            {/* ── Resumen ── */}
            <div className={styles.resumen}>
              <div className={styles.resumenRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className={styles.resumenRow}><span>IVA 16%</span><span>${iva.toFixed(2)}</span></div>
              {totalDescuentos > 0.01 && (
                <div className={`${styles.resumenRow} ${styles.resumenAhorro}`}>
                  <span>Descuentos aplicados</span>
                  <span>-${totalDescuentos.toFixed(2)}</span>
                </div>
              )}
              <div className={`${styles.resumenRow} ${styles.resumenTotal}`}>
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button className={styles.confirmarBtn} onClick={confirmar} disabled={!pagoValido || guardando}>
              {guardando ? "Registrando..." : `Confirmar cobro · $${total.toFixed(2)}`}
            </button>
          </>
        ) : (
          <>
            <div className={styles.ticketHeader}>
              <div className={styles.ticketCheck}>✓</div>
              <div className={styles.ticketTitulo}>¡Venta completada!</div>
              <div className={styles.ticketSub}>{hora}</div>
            </div>

            {/* ── Ticket ── */}
            <div className={styles.ticket}>
              <div className={styles.ticketNegocio}>PAPELERÍA DANABRI</div>
              <div className={styles.ticketSucursal}>Sucursal Centro</div>
              {folio && <div className={styles.ticketFolio}>Folio: {folio}</div>}
              <div className={styles.ticketDivider} />

              <div className={styles.ticketCliente}>
                Cliente: {cliente?.nombre || "Público General"}
              </div>
              {vendedor && (
                <div className={styles.ticketRow}>
                  <span>Vendedor</span><span>{vendedor.nombre}</span>
                </div>
              )}
              <div className={styles.ticketRow}>
                <span>Cajero</span><span>Caja 1</span>
              </div>
              <div className={styles.ticketDivider} />

              {itemsConDescuento.map((item, i) => {
                const precio = item.precio_unitario ?? 0;
                return (
                  <div key={i} className={styles.ticketItem}>
                    <span className={styles.ticketItemNombre}>{item.emoji} {item.nombre}</span>
                    <span className={styles.ticketItemQty}>x{item.cantidad}</span>
                    <span className={styles.ticketItemPrecio}>${(precio * item.cantidad).toFixed(2)}</span>
                  </div>
                );
              })}

              <div className={styles.ticketDivider} />
              <div className={styles.ticketRow}><span>Total piezas</span><span>{totalPiezas}</span></div>
              <div className={styles.ticketRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className={styles.ticketRow}><span>IVA</span><span>${iva.toFixed(2)}</span></div>
              {totalDescuentos > 0.01 && (
                <div className={`${styles.ticketRow} ${styles.ticketAhorro}`}>
                  <span>Descuentos</span><span>-${totalDescuentos.toFixed(2)}</span>
                </div>
              )}
              <div className={`${styles.ticketRow} ${styles.ticketRowTotal}`}>
                <span>TOTAL</span><span>${total.toFixed(2)}</span>
              </div>

              <div className={styles.ticketDivider} />
              {pagos.map((p, i) => (
                <div key={i} className={styles.ticketRow}>
                  <span>{METODOS.find((m) => m.id === p.metodo_pago)?.emoji} {METODOS.find((m) => m.id === p.metodo_pago)?.label}</span>
                  <span>${parseFloat(p.monto).toFixed(2)}</span>
                </div>
              ))}
              {tieneEfectivo && cambio > 0 && (
                <div className={styles.ticketRow}><span>Cambio</span><span>${cambio.toFixed(2)}</span></div>
              )}

              <div className={styles.ticketDivider} />
              <div className={styles.ticketFacturacion}>
                Factura en línea: <strong>{LINK_FACTURACION}</strong>
              </div>
              <div className={styles.ticketGracias}>¡Gracias por su compra!</div>
            </div>

            <div className={styles.ticketBtns}>
              <button className={styles.imprimirBtn} onClick={() => window.print()}>🖨️ Imprimir</button>
              <button
                className={styles.imprimirBtn}
                onClick={() => generarRemisionPDF({
                  items: itemsConDescuento,
                  cliente,
                  vendedor,
                  folio: folio || `REM-${Date.now()}`,
                  subtotal, iva, total,
                  pagos,
                  cambio: cambio > 0 ? cambio : 0,
                  ahorro: totalDescuentos,
                })}
              >📄 Remisión</button>
              <button className={styles.confirmarBtn} onClick={cerrarTicket}>Nueva venta</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ModalCobro;
