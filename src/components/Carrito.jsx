import { useState } from "react";
import { useCart } from "./CartContext";
import ModalCobro from "./ModalCobro";
import styles from "./Carrito.module.css";

function Toast({ mensaje, emoji, visible }) {
  return (
    <div className={`${styles.toast} ${visible ? styles.toastVisible : ""}`}>
      <span className={styles.toastEmoji}>{emoji}</span>
      <span className={styles.toastMsg}>{mensaje}</span>
    </div>
  );
}

function Carrito({ onVentaCompletada }) {
  const { carrito, cambiarCantidad, limpiar, totalItems, subtotal, iva, total } = useCart();
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [modalAbierto,  setModalAbierto]  = useState(false);
  const [toast, setToast] = useState({ visible: false, mensaje: "", emoji: "" });

  const mostrarToast = (mensaje, emoji = "✅") => {
    setToast({ visible: true, mensaje, emoji });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  };

  const cobrar = () => {
    setModalAbierto(true);
    setDrawerAbierto(false);
  };

  const onConfirmar = () => {
    limpiar();
    mostrarToast("Venta registrada exitosamente", "🎉");
    if (onVentaCompletada) onVentaCompletada();
  };

  const items = Object.values(carrito);

  const contenido = (
    <>
      <div className={styles.items}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🛒</span>
            <span className={styles.emptyText}>Sin productos aún</span>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={styles.item}>
              <span className={styles.itemEmoji}>{item.emoji}</span>
              <div className={styles.itemInfo}>
                <div className={styles.itemNombre}>{item.nombre}</div>
                <div className={styles.itemPrecio}>${item.precio_menudeo ?? item.precio} c/u</div>
              </div>
              <div className={styles.controls}>
                <button className={styles.qtyBtn} onClick={() => cambiarCantidad(item.id, -1)}>−</button>
                <span className={styles.qty}>{item.cantidad}</span>
                <button
                  className={`${styles.qtyBtn} ${item.cantidad >= item.stock ? styles.qtyBtnDisabled : ""}`}
                  onClick={() => cambiarCantidad(item.id, 1)}
                  disabled={item.cantidad >= item.stock}
                >+</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.totales}>
          <div className={styles.row}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className={styles.row}><span>IVA (16%)</span><span>${iva.toFixed(2)}</span></div>
          <div className={`${styles.row} ${styles.rowTotal}`}>
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>
        <button className={styles.cobrarBtn} onClick={cobrar} disabled={items.length === 0}>
          Cobrar
        </button>
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

      {modalAbierto && (
        <ModalCobro
          total={total}
          subtotal={subtotal}
          iva={iva}
          items={items}
          onCerrar={() => setModalAbierto(false)}
          onConfirmar={onConfirmar}
        />
      )}
    </>
  );
}

export default Carrito;