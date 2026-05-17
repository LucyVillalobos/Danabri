import { useState, useEffect } from "react";
import { generarCotizacionPDF, generarRemisionPDF } from "../utils/generarPDF";
import { getUsuarios } from "../api/api";
import { useCart } from "./CartContext";
import ModalCobro from "./ModalCobro";
import ModalPin   from "./ModalPin";
import styles from "./Carrito.module.css";

function Toast({ mensaje, emoji, visible }) {
  return (
    <div className={`${styles.toast} ${visible ? styles.toastVisible : ""}`}>
      <span className={styles.toastEmoji}>{emoji}</span>
      <span className={styles.toastMsg}>{mensaje}</span>
    </div>
  );
}

/* Panel de descuento/precio manual para un ítem */
function PanelDescuento({ item, onCerrar }) {
  const { aplicarDescuento, cambiarPrecioManual, quitarDescuento, esSuperusuario } = useCart();
  const [modo,      setModo]      = useState("pct");   // "pct" | "manual"
  const [valorPct,  setValorPct]  = useState(item.descuento_pct || "");
  const [valorManual, setValorManual] = useState(item.precio_manual ?? item.precio_unitario ?? "");

  if (!esSuperusuario) return null;

  const aplicar = () => {
    if (modo === "pct") {
      const pct = parseFloat(valorPct);
      if (!isNaN(pct) && pct >= 0 && pct <= 100) {
        aplicarDescuento(item.id, pct);
        onCerrar();
      }
    } else {
      cambiarPrecioManual(item.id, valorManual);
      onCerrar();
    }
  };

  const base = item.precio_menudeo ?? item.precio ?? 0;
  const previo = modo === "pct" && valorPct !== ""
    ? (base * (1 - parseFloat(valorPct || 0) / 100)).toFixed(2)
    : null;

  return (
    <div className={styles.panelDesc}>
      <div className={styles.panelDescTabs}>
        <button
          className={`${styles.panelTab} ${modo === "pct" ? styles.panelTabActivo : ""}`}
          onClick={() => setModo("pct")}
        >% Descuento</button>
        <button
          className={`${styles.panelTab} ${modo === "manual" ? styles.panelTabActivo : ""}`}
          onClick={() => setModo("manual")}
        >$ Precio</button>
      </div>

      {modo === "pct" ? (
        <div className={styles.panelDescRow}>
          <input
            className={styles.panelInput}
            type="number"
            min={0} max={100}
            placeholder="0"
            value={valorPct}
            onChange={(e) => setValorPct(e.target.value)}
            autoFocus
          />
          <span className={styles.panelUnit}>%</span>
          {previo && <span className={styles.panelPreview}>${previo}</span>}
        </div>
      ) : (
        <div className={styles.panelDescRow}>
          <span className={styles.panelUnit}>$</span>
          <input
            className={styles.panelInput}
            type="number"
            min={0}
            placeholder="0.00"
            value={valorManual}
            onChange={(e) => setValorManual(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <div className={styles.panelDescBtns}>
        <button className={styles.panelBtnOk}    onClick={aplicar}>Aplicar</button>
        {(item.descuento_pct > 0 || item.precio_manual !== null) && (
          <button className={styles.panelBtnQuitar} onClick={() => { quitarDescuento(item.id); onCerrar(); }}>
            Quitar
          </button>
        )}
        <button className={styles.panelBtnCancelar} onClick={onCerrar}>✕</button>
      </div>
    </div>
  );
}

function Carrito({ onVentaCompletada }) {
  const {
    carrito, cambiarCantidad, limpiar,
    totalItems, subtotal, iva, total, ahorro,
    cliente, seleccionarCliente,
    vendedor, setVendedor,
    esSuperusuario, setEsSuperusuario,
  } = useCart();

  const [drawerAbierto,  setDrawerAbierto]  = useState(false);
  const [usuarios,       setUsuarios]       = useState([]);
  const [modalAbierto,   setModalAbierto]   = useState(false);
  const [pinAbierto,     setPinAbierto]     = useState(false);
  const [itemDescAbierto, setItemDescAbierto] = useState(null); // id del ítem con panel abierto
  const [toast, setToast] = useState({ visible: false, mensaje: "", emoji: "" });

  useEffect(() => {
    getUsuarios()
      .then(setUsuarios)
      .catch(() => setUsuarios([
        { id_usuario: 1, nombre: "admin" },
      ]));
  }, []);

  const mostrarToast = (mensaje, emoji = "✅") => {
    setToast({ visible: true, mensaje, emoji });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  };

  const cobrar = () => { setModalAbierto(true); setDrawerAbierto(false); };

  const onConfirmar = () => {
    limpiar();
    mostrarToast("Venta registrada exitosamente", "🎉");
    if (onVentaCompletada) onVentaCompletada();
  };

  const pedirDescuento = (id) => {
    if (!esSuperusuario) { setPinAbierto(true); return; }
    setItemDescAbierto(id === itemDescAbierto ? null : id);
  };

  const items = Object.values(carrito);

  const contenido = (
    <>
      {/* ── Barra superusuario ───────────────────────────────── */}
      <div className={styles.superBar}>
        {esSuperusuario ? (
          <div className={styles.superActivo}>
            <span>🔓 Superusuario activo</span>
            <button className={styles.superSalir} onClick={() => { setEsSuperusuario(false); setItemDescAbierto(null); }}>
              Salir
            </button>
          </div>
        ) : (
          <button className={styles.superBtn} onClick={() => setPinAbierto(true)}>
            🔐 Acceso superusuario
          </button>
        )}
      </div>

      {/* ── Vendedor ─────────────────────────────────────────── */}
      <div className={styles.selectorWrap}>
        <span className={styles.selectorLabel}>👤 Vendedor</span>
        <select
          className={styles.selector}
          value={vendedor?.id || ""}
          onChange={(e) => {
            const op = e.target.options[e.target.selectedIndex];
            setVendedor(e.target.value ? { id: e.target.value, nombre: op.text } : null);
          }}
        >
          <option value="">Sin asignar</option>
          {usuarios.map((u) => (
            <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>
          ))}
        </select>
      </div>

      {/* ── Cliente activo ───────────────────────────────────── */}
      {cliente && (
        <div className={styles.clienteBadge}>
          <span className={styles.clienteBadgeAvatar}>{cliente.nombre?.charAt(0)}</span>
          <div className={styles.clienteBadgeInfo}>
            <span className={styles.clienteBadgeNombre}>{cliente.nombre}</span>
            <span className={styles.clienteBadgeTipo}>{cliente.tipo_cliente}</span>
          </div>
          <button className={styles.clienteBadgeQuitar} onClick={() => seleccionarCliente(null)}>✕</button>
        </div>
      )}

      {/* ── Lista de productos ────────────────────────────────── */}
      <div className={styles.items}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🛒</span>
            <span className={styles.emptyText}>Sin productos aún</span>
          </div>
        ) : (
          items.map((item) => {
            const precioUnitario = item.precio_unitario ?? item.precio_menudeo ?? item.precio ?? 0;
            const precioBase     = item.precio_menudeo ?? item.precio ?? 0;
            const esMayoreo      = precioUnitario < precioBase && item.descuento_pct === 0 && item.precio_manual === null;
            const tieneDesc      = item.descuento_pct > 0;
            const tienePrecioM   = item.precio_manual !== null;
            const panelAbierto   = itemDescAbierto === item.id;

            return (
              <div key={item.id} className={styles.itemWrap}>
                <div className={`${styles.item} ${tieneDesc || tienePrecioM ? styles.itemConDesc : ""}`}>
                  <span className={styles.itemEmoji}>{item.emoji}</span>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemNombre}>{item.nombre}</div>
                    <div className={styles.itemPrecio}>
                      ${precioUnitario.toFixed(2)} c/u
                      {esMayoreo  && <span className={styles.tagMayoreo}>mayoreo</span>}
                      {tieneDesc  && <span className={styles.tagDesc}>-{item.descuento_pct}%</span>}
                      {tienePrecioM && <span className={styles.tagManual}>precio manual</span>}
                    </div>
                  </div>
                  <div className={styles.controls}>
                    {esSuperusuario && (
                      <button
                        className={`${styles.descBtn} ${panelAbierto ? styles.descBtnActivo : ""}`}
                        onClick={() => pedirDescuento(item.id)}
                        title="Descuento / precio manual"
                      >%</button>
                    )}
                    <button className={styles.qtyBtn} onClick={() => cambiarCantidad(item.id, -1)}>−</button>
                    <span className={styles.qty}>{item.cantidad}</span>
                    <button
                      className={`${styles.qtyBtn} ${item.cantidad >= item.stock ? styles.qtyBtnDisabled : ""}`}
                      onClick={() => cambiarCantidad(item.id, 1)}
                      disabled={item.cantidad >= item.stock}
                    >+</button>
                  </div>
                </div>

                {panelAbierto && (
                  <PanelDescuento item={item} onCerrar={() => setItemDescAbierto(null)} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Totales y botones ────────────────────────────────── */}
      <div className={styles.footer}>
        <div className={styles.totales}>
          <div className={styles.row}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className={styles.row}><span>IVA (16%)</span><span>${iva.toFixed(2)}</span></div>
          {ahorro > 0.01 && (
            <div className={`${styles.row} ${styles.rowAhorro}`}>
              <span>Ahorro</span><span>-${ahorro.toFixed(2)}</span>
            </div>
          )}
          <div className={`${styles.row} ${styles.rowTotal}`}>
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        <button className={styles.cobrarBtn} onClick={cobrar} disabled={items.length === 0}>
          Cobrar
        </button>

        <div className={styles.botonesSecundarios}>
          <button
            className={styles.btnSecundario}
            disabled={items.length === 0}
            onClick={() => {
              const f = `COT-${Date.now()}`;
              generarCotizacionPDF({ items, cliente, vendedor, folio: f, subtotal, iva, total, ahorro });
              mostrarToast("Cotización generada", "📋");
            }}
          >📋 Cotización</button>
          <button
            className={styles.btnSecundario}
            disabled={items.length === 0}
            onClick={() => {
              const f = `REM-${Date.now()}`;
              generarRemisionPDF({ items, cliente, vendedor, folio: f, subtotal, iva, total, ahorro });
              mostrarToast("Remisión generada", "📄");
            }}
          >📄 Remisión</button>
        </div>

        <button className={styles.limpiarBtn} onClick={limpiar}>Limpiar orden</button>
      </div>
    </>
  );

  return (
    <>
      <Toast {...toast} />

      {/* DESKTOP */}
      <aside className={styles.carritoDesktop}>
        <div className={styles.header}>
          <span className={styles.titulo}>Orden</span>
          <span className={styles.count}>{totalItems}</span>
        </div>
        {contenido}
      </aside>

      {/* FAB móvil */}
      <button className={styles.fab} onClick={() => setDrawerAbierto(true)} aria-label="Ver carrito">
        🛒
        {totalItems > 0 && <span className={styles.fabBadge}>{totalItems}</span>}
      </button>

      {drawerAbierto && <div className={styles.overlay} onClick={() => setDrawerAbierto(false)} />}

      <div className={`${styles.drawer} ${drawerAbierto ? styles.drawerOpen : ""}`}>
        <div className={styles.drawerHandle} onClick={() => setDrawerAbierto(false)} />
        <div className={styles.header}>
          <span className={styles.titulo}>Orden</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className={styles.count}>{totalItems}</span>
            <button className={styles.cerrarBtn} onClick={() => setDrawerAbierto(false)}>✕</button>
          </div>
        </div>
        {contenido}
      </div>

      {/* Modal cobro */}
      {modalAbierto && (
        <ModalCobro
          total={total}
          subtotal={subtotal}
          iva={iva}
          ahorro={ahorro}
          items={items}
          onCerrar={() => setModalAbierto(false)}
          onConfirmar={onConfirmar}
        />
      )}

      {/* Modal PIN */}
      {pinAbierto && (
        <ModalPin
          onExito={() => setEsSuperusuario(true)}
          onCerrar={() => setPinAbierto(false)}
        />
      )}
    </>
  );
}

export default Carrito;
