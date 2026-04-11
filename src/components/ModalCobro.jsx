import { useState, useEffect, useRef } from "react";
import { useCart } from "./CartContext";
import { getClientes, crearVenta } from "../api/api";
import styles from "./ModalCobro.module.css";

const METODOS = [
  { id: "efectivo",      label: "Efectivo",     emoji: "💵" },
  { id: "tarjeta",       label: "Tarjeta",       emoji: "💳" },
  { id: "transferencia", label: "Transferencia", emoji: "📱" },
];

const COLORES = ["#e8734a","#2d3748","#c8d4db","#f59e0b","#10b981","#6366f1","#ec4899"];


function ModalCobro({ total, subtotal, iva, items, onCerrar, onConfirmar }) {
  const { registrarVenta = () => {} } = useCart() ?? {};

  const [metodo,      setMetodo]    = useState("efectivo");
  const [clienteId,   setClienteId] = useState(null);
  const [clientes,    setClientes]  = useState([]);
  const [busqueda,    setBusqueda]  = useState("");
  const [efectivoStr, setEfectivo]  = useState("");
  const [fase,        setFase]      = useState("cobro");
  const [guardando,   setGuardando] = useState(false);
  const [folio,       setFolio]     = useState("");

  useEffect(() => {
    getClientes()
      .then((data) => {
        setClientes(data);
        if (data.length > 0) setClienteId(data[0].id_cliente);
      })
      .catch(() => {
        const fallback = [{ id_cliente: 0, nombre: "Cliente General", tipo_cliente: "menudeo" }];
        setClientes(fallback);
        setClienteId(0);
      });
  }, []);

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const clienteSeleccionado = clientes.find((c) => c.id_cliente === clienteId);

  const efectivoPago = parseFloat(efectivoStr) || 0;
  const cambio       = efectivoPago - total;
  const pagoValido   = metodo !== "efectivo" || efectivoPago >= total;

  const confirmar = async () => {
    if (!pagoValido || guardando) return;
    setGuardando(true);

    try {
      const result = await crearVenta({
        id_usuario:  1,
        id_cliente:  clienteId,
        metodo_pago: metodo,
        items: items.map((item) => ({
          id_presentacion: item.id_presentacion || item.id,
          cantidad:        item.cantidad,
          precio_unitario: item.precio_menudeo ?? item.precio,
        })),  
        monto_pagado: metodo === "efectivo" ? efectivoPago : total,
      });

      setFolio(result.folio);
      registrarVenta({
        cliente: clienteSeleccionado?.nombre || "Cliente General",
        metodo, total, subtotal, iva, items,
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
    hour: "2-digit", minute: "2-digit"
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

            {/* Buscador de clientes */}
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
                {clientesFiltrados.map((c) => (
                  <div
                    key={c.id_cliente}
                    className={`${styles.clienteItem} ${clienteId === c.id_cliente ? styles.clienteItemActivo : ""}`}
                    onClick={() => { setClienteId(c.id_cliente); setBusqueda(""); }}
                  >
                    <div className={styles.clienteAvatar}>
                      {c.nombre.charAt(0)}
                    </div>
                    <div className={styles.clienteInfo}>
                      <span className={styles.clienteNombre}>{c.nombre}</span>
                      <span className={styles.clienteTipo}>{c.tipo_cliente}</span>
                    </div>
                    {clienteId === c.id_cliente && <span className={styles.clienteCheck}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Método de pago */}
            <div className={styles.seccion}>
              <label className={styles.label}>Método de pago</label>
              <div className={styles.metodos}>
                {METODOS.map((m) => (
                  <button
                    key={m.id}
                    className={`${styles.metodoBtn} ${metodo === m.id ? styles.metodoBtnActivo : ""}`}
                    onClick={() => setMetodo(m.id)}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {metodo === "efectivo" && (
              <div className={styles.seccion}>
                <label className={styles.label}>Pago con</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputPrefix}>$</span>
                  <input
                    className={styles.input}
                    type="number"
                    placeholder="0.00"
                    value={efectivoStr}
                    onChange={(e) => setEfectivo(e.target.value)}
                    min={0}
                    autoFocus
                  />
                </div>
                {efectivoPago > 0 && (
                  <div className={`${styles.cambio} ${cambio < 0 ? styles.cambioNeg : styles.cambioPos}`}>
                    {cambio < 0 ? `Faltan $${Math.abs(cambio).toFixed(2)}` : `Cambio: $${cambio.toFixed(2)}`}
                  </div>
                )}
              </div>
            )}

            <div className={styles.resumen}>
              <div className={styles.resumenRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className={styles.resumenRow}><span>IVA 16%</span><span>${iva.toFixed(2)}</span></div>
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

            <div className={styles.ticket}>
              <div className={styles.ticketNegocio}>PAPELERA DANABRI</div>
              <div className={styles.ticketSucursal}>Sucursal Centro</div>
              {folio && <div className={styles.ticketFolio}>Folio: {folio}</div>}
              <div className={styles.ticketDivider} />
              <div className={styles.ticketCliente}>Cliente: {clienteSeleccionado?.nombre}</div>
              <div className={styles.ticketDivider} />
              {items.map((item, i) => (
                <div key={i} className={styles.ticketItem}>
                  <span className={styles.ticketItemNombre}>{item.emoji} {item.nombre}</span>
                  <span className={styles.ticketItemQty}>x{item.cantidad}</span>
                  <span className={styles.ticketItemPrecio}>${((item.precio_menudeo ?? item.precio) * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <div className={styles.ticketDivider} />
              <div className={styles.ticketRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className={styles.ticketRow}><span>IVA</span><span>${iva.toFixed(2)}</span></div>
              <div className={`${styles.ticketRow} ${styles.ticketRowTotal}`}>
                <span>TOTAL</span><span>${total.toFixed(2)}</span>
              </div>
              <div className={styles.ticketDivider} />
              <div className={styles.ticketRow}><span>Método</span><span>{METODOS.find(m => m.id === metodo)?.label}</span></div>
              {metodo === "efectivo" && (
                <>
                  <div className={styles.ticketRow}><span>Pago</span><span>${efectivoPago.toFixed(2)}</span></div>
                  <div className={styles.ticketRow}><span>Cambio</span><span>${cambio.toFixed(2)}</span></div>
                </>
              )}
              <div className={styles.ticketDivider} />
              <div className={styles.ticketGracias}>¡Gracias por su compra!</div>
            </div>

            <div className={styles.ticketBtns}>
              <button className={styles.imprimirBtn} onClick={() => window.print()}>🖨️ Imprimir</button>
              <button className={styles.confirmarBtn} onClick={cerrarTicket}>Nueva venta</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ModalCobro;