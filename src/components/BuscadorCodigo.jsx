import { useState, useRef } from "react";
import { useCart } from "./CartContext";
import { buscarProductos } from "../api/api";
import styles from "./BuscadorCodigo.module.css";

/**
 * Campo de entrada para lector de código de barras.
 * - Si el código coincide con código_barras de una presentación (unitario),
 *   agrega 1 pieza.
 * - Si coincide con código_barras_paquete, agrega piezas_por_presentacion.
 */
export default function BuscadorCodigo() {
  const { agregar, agregarPorCodigo } = useCart();
  const [codigo,  setCodigo]  = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipo,    setTipo]    = useState(""); // ok | error
  const inputRef = useRef();

  const mostrarMsg = (txt, t, ms=2000) => {
    setMensaje(txt); setTipo(t);
    setTimeout(() => { setMensaje(""); setTipo(""); }, ms);
  };

  const buscar = async (cod) => {
    const c = cod.trim();
    if (!c) return;
    try {
      const resultados = await buscarProductos(c);
      if (!resultados.length) { mostrarMsg(`Código no encontrado: ${c}`, "error"); return; }
      const prod = resultados[0];
      const item = {
        id:                    prod.id_presentacion,
        id_presentacion:       prod.id_presentacion,
        nombre:                prod.nombre,
        precio_menudeo:        prod.precio_menudeo,
        precio_mayoreo:        prod.precio_mayoreo,
        precio:                prod.precio_menudeo,
        stock:                 prod.stock,
        piezas_por_presentacion: prod.piezas_por_presentacion || 1,
        emoji:                 "📦",
      };
      // Si el código buscado coincide con el de paquete, suma las piezas del paquete
      const esPaquete = prod.codigo_barras_paquete && prod.codigo_barras_paquete === c;
      if (esPaquete) {
        agregarPorCodigo(item);
        mostrarMsg(`+${item.piezas_por_presentacion} pzas — ${prod.nombre}`, "ok");
      } else {
        agregar(item);
        mostrarMsg(`+1 pza — ${prod.nombre}`, "ok");
      }
    } catch { mostrarMsg("Error al buscar código", "error"); }
    setCodigo("");
    inputRef.current?.focus();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.inputWrap}>
        <span className={styles.icon}>📷</span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Escanear código de barras..."
          value={codigo}
          onChange={e=>setCodigo(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") buscar(codigo); }}
        />
        {codigo && (
          <button className={styles.btnBuscar} onClick={()=>buscar(codigo)}>→</button>
        )}
      </div>
      {mensaje && (
        <div className={`${styles.msg} ${tipo==="ok"?styles.msgOk:styles.msgErr}`}>
          {mensaje}
        </div>
      )}
    </div>
  );
}
