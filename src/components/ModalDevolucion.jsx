import { useState } from "react";
import { getVentaPorFolio, crearDevolucion } from "../api/api";
import styles from "./ModalDevolucion.module.css";

const TIPOS = [
  { id: "cambio",  label: "Cambio de producto", emoji: "🔄" },
  { id: "merma",   label: "Merma / daño",        emoji: "🗑️" },
  { id: "error",   label: "Error de captura",    emoji: "✏️" },
  { id: "cliente", label: "Decisión del cliente", emoji: "👤" },
];

function ModalDevolucion({ onCerrar, onDevolucionRegistrada }) {
  const [fase,       setFase]       = useState("buscar"); // buscar | seleccionar | confirmar | resultado
  const [folio,      setFolio]      = useState("");
  const [venta,      setVenta]      = useState(null);
  const [buscando,   setBuscando]   = useState(false);
  const [errBusqueda, setErrBusqueda] = useState("");

  // selección de ítems a devolver
  const [seleccion,  setSeleccion]  = useState({}); // { id: cantidad }
  const [tipo,       setTipo]       = useState("cliente");
  const [guardando,  setGuardando]  = useState(false);
  const [resultado,  setResultado]  = useState(null);

  const buscar = async () => {
    if (!folio.trim()) return;
    setBuscando(true);
    setErrBusqueda("");
    try {
      const data = await getVentaPorFolio(folio.trim());
      setVenta(data);
      // inicializar selección con 0 de cada ítem
      const sel = {};
      (data.items || []).forEach((it) => { sel[it.id_detalle ?? it.id] = 0; });
      setSeleccion(sel);
      setFase("seleccionar");
    } catch (e) {
      setErrBusqueda(e.message);
    } finally {
      setBuscando(false);
    }
  };

  const toggleTotal = () => {
    const yaTotal = (venta.items || []).every(
      (it) => seleccion[it.id_detalle ?? it.id] === it.cantidad
    );
    const sel = {};
    (venta.items || []).forEach((it) => {
      sel[it.id_detalle ?? it.id] = yaTotal ? 0 : it.cantidad;
    });
    setSeleccion(sel);
  };

  const cambiarCantidad = (id, delta, max) => {
    setSeleccion((prev) => {
      const nueva = Math.min(max, Math.max(0, (prev[id] || 0) + delta));
      return { ...prev, [id]: nueva };
    });
  };

  const totalDevolver  = Object.values(seleccion).reduce((a, c) => a + c, 0);
  const montoDevolver  = (venta?.items || []).reduce((a, it) => {
    const id  = it.id_detalle ?? it.id;
    const qty = seleccion[id] || 0;
    return a + qty * parseFloat(it.precio_unitario || 0);
  }, 0);

  const confirmar = async () => {
    if (totalDevolver === 0 || guardando) return;
    setGuardando(true);
    try {
      const itemsDev = (venta.items || [])
        .filter((it) => (seleccion[it.id_detalle ?? it.id] || 0) > 0)
        .map((it) => ({
          id_detalle:      it.id_detalle ?? it.id,
          id_presentacion: it.id_presentacion,
          cantidad:        seleccion[it.id_detalle ?? it.id],
          precio_unitario: it.precio_unitario,
        }));

      const res = await crearDevolucion({
        folio_original: venta.folio,
        items:          itemsDev,
        tipo,
        id_caja:        1,
        id_usuario:     1,
      });
      setResultado(res);
      setFase("resultado");
      if (onDevolucionRegistrada) onDevolucionRegistrada();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.titulo}>🔄 Devolución de mercancía</span>
          <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
        </div>

        {/* ── FASE: buscar ── */}
        {fase === "buscar" && (
          <div className={styles.seccion}>
            <label className={styles.label}>Número de ticket / folio</label>
            <div className={styles.buscarRow}>
              <input
                className={styles.inputFolio}
                type="text"
                placeholder="Ej. DAN-00123"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscar()}
                autoFocus
              />
              <button className={styles.btnBuscar} onClick={buscar} disabled={buscando}>
                {buscando ? "..." : "Buscar"}
              </button>
            </div>
            {errBusqueda && <div className={styles.error}>{errBusqueda}</div>}
          </div>
        )}

        {/* ── FASE: seleccionar ── */}
        {fase === "seleccionar" && venta && (
          <>
            {/* Info del ticket */}
            <div className={styles.ticketInfo}>
              <div className={styles.ticketInfoRow}>
                <span className={styles.ticketFolio}>📄 {venta.folio}</span>
                <span className={styles.ticketTotal}>${parseFloat(venta.total).toFixed(2)}</span>
              </div>
              <div className={styles.ticketInfoRow}>
                <span className={styles.ticketMeta}>{venta.cliente || "Público General"}</span>
                <span className={styles.ticketMeta}>{venta.metodo_pago}</span>
              </div>
              {venta.metodo_pago !== "efectivo" && (
                <div className={styles.avisoTarjeta}>
                  ⚠️ Venta pagada con {venta.metodo_pago} — la devolución se realizará en efectivo
                </div>
              )}
            </div>

            {/* Selección total / parcial */}
            <div className={styles.modoBtns}>
              <button className={styles.modoBtn} onClick={toggleTotal}>
                {(venta.items || []).every((it) => seleccion[it.id_detalle ?? it.id] === it.cantidad)
                  ? "Deseleccionar todo"
                  : "Seleccionar todo (devolución total)"}
              </button>
            </div>

            {/* Lista de ítems */}
            <div className={styles.itemsLista}>
              {(venta.items || []).map((it) => {
                const id  = it.id_detalle ?? it.id;
                const qty = seleccion[id] || 0;
                return (
                  <div key={id} className={`${styles.itemRow} ${qty > 0 ? styles.itemRowActivo : ""}`}>
                    <div className={styles.itemNombre}>{it.nombre || it.descripcion}</div>
                    <div className={styles.itemDatos}>
                      <span className={styles.itemPrecio}>${parseFloat(it.precio_unitario || 0).toFixed(2)}</span>
                      <span className={styles.itemMax}>/{it.cantidad} pz</span>
                    </div>
                    <div className={styles.qtyCtrls}>
                      <button className={styles.qtyBtn} onClick={() => cambiarCantidad(id, -1, it.cantidad)}>−</button>
                      <span className={styles.qty}>{qty}</span>
                      <button className={styles.qtyBtn} onClick={() => cambiarCantidad(id, 1, it.cantidad)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tipo de devolución */}
            <div className={styles.seccion}>
              <label className={styles.label}>Motivo</label>
              <div className={styles.tiposGrid}>
                {TIPOS.map((t) => (
                  <button
                    key={t.id}
                    className={`${styles.tipoBtn} ${tipo === t.id ? styles.tipoBtnActivo : ""}`}
                    onClick={() => setTipo(t.id)}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen */}
            {totalDevolver > 0 && (
              <div className={styles.resumen}>
                <span>{totalDevolver} pieza(s) a devolver</span>
                <span className={styles.resumenMonto}>-${montoDevolver.toFixed(2)}</span>
              </div>
            )}

            <div className={styles.footerBtns}>
              <button className={styles.btnVolver} onClick={() => setFase("buscar")}>← Volver</button>
              <button
                className={styles.btnConfirmar}
                onClick={confirmar}
                disabled={totalDevolver === 0 || guardando}
              >
                {guardando ? "Registrando..." : "Registrar devolución"}
              </button>
            </div>
          </>
        )}

        {/* ── FASE: resultado ── */}
        {fase === "resultado" && resultado && (
          <div className={styles.resultadoWrap}>
            <div className={styles.resultadoCheck}>✓</div>
            <div className={styles.resultadoTitulo}>Devolución registrada</div>
            <div className={styles.resultadoFolio}>Folio: {resultado.folio_devolucion}</div>
            <div className={styles.resultadoInfo}>
              Se imprimirán 2 copias del ticket de devolución.<br/>
              La devolución aparecerá en el corte del día.
            </div>
            <div className={styles.resultadoBtns}>
              <button className={styles.btnImprimir} onClick={() => window.print()}>🖨️ Imprimir (2 copias)</button>
              <button className={styles.btnConfirmar} onClick={onCerrar}>Cerrar</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ModalDevolucion;
