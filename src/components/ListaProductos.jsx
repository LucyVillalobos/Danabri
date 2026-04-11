import { useState } from "react";
import { useCart } from "./CartContext";
import styles from "./ListaProductos.module.css";

const STOCK_BAJO = 5;

function ListaProductos({ productos }) {
  const { carrito, agregar } = useCart();
  const [solicitudes, setSolicitudes] = useState({});

  const solicitarResurtido = (e, producto) => {
    e.stopPropagation();
    setSolicitudes((prev) => ({ ...prev, [producto.id]: "enviando" }));
    setTimeout(() => {
      setSolicitudes((prev) => ({ ...prev, [producto.id]: "enviado" }));
    }, 1000);
  };

  return (
    <div className={styles.grid}>
      {productos.map((producto) => {
        const cantidad  = carrito[producto.id]?.cantidad || 0;
        const agotado   = producto.stock === 0;
        const stockBajo = producto.stock > 0 && producto.stock <= STOCK_BAJO;
        const estado    = solicitudes[producto.id];

        return (
          <div
            key={producto.id}
            className={`${styles.card} ${agotado ? styles.out : ""} ${stockBajo ? styles.stockBajo : ""}`}
            onClick={() => !agotado && agregar(producto)}
          >
            {cantidad > 0 && <div className={styles.badgeCart}>{cantidad}</div>}
            {stockBajo && <div className={`${styles.badgeStock} ${styles.bajo}`}>⚠ {producto.stock}</div>}

            <span className={styles.emoji}>{producto.emoji}</span>
            <div className={styles.nombre}>{producto.nombre}</div>
            <div className={styles.precio}>
              ${producto.precio_menudeo ?? producto.precio}
            </div>

            {agotado ? (
              <button
                className={`${styles.resurtidoBtn} ${estado === "enviando" ? styles.enviando : ""} ${estado === "enviado" ? styles.enviado : ""}`}
                onClick={(e) => !estado && solicitarResurtido(e, producto)}
              >
                {estado === "enviando" && "Enviando..."}
                {estado === "enviado" && "✓ Solicitado"}
                {!estado && "Solicitar resurtido"}
              </button>
            ) : (
              <div className={styles.stock}>{producto.stock} disp.</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ListaProductos;