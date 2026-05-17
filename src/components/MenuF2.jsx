import { useState } from "react";
import ModalDescuentosActivos from "./ModalDescuentosActivos";
import ModalAperturaCaja     from "./ModalAperturaCaja";
import ModalRetiroEfectivo   from "./ModalRetiroEfectivo";
import ModalCambioTurno      from "./ModalCambioTurno";
import ModalDevolucion        from "./ModalDevolucion";
import ModalCorte             from "./ModalCorte";
import ModalSalidaEfectivo    from "./ModalSalidaEfectivo";
import ModalFacturar          from "./ModalFacturar";
import styles from "./MenuF2.module.css";

const OPCIONES = [
  { id: "descuentos",  emoji: "🏷️",  label: "Descuentos activos",  desc: "Ver productos y marcas con descuento vigente" },
  { id: "devolucion",  emoji: "🔄",  label: "Devolución",           desc: "Buscar ticket y registrar devolución parcial o total" },
  { id: "reimprimir",  emoji: "🖨️",  label: "Reimprimir ticket",    desc: "Imprimir copia de un ticket por folio" },
  { id: "facturar",    emoji: "📋",  label: "Facturar ticket(s)",   desc: "Crear factura desde uno o varios tickets/remisiones" },
  { id: "apertura",    emoji: "💰",  label: "Apertura de caja",    desc: "Registrar el fondo inicial al abrir la caja" },
  { id: "retiro",      emoji: "💸",  label: "Retiro de efectivo",   desc: "Retirar efectivo con tabulador de denominaciones" },
  { id: "turno",       emoji: "🔄",  label: "Cambio de turno",      desc: "Entrega de caja entre cajeros con conteo de efectivo" },
  { id: "precorte",    emoji: "📊",  label: "Pre-corte de caja",    desc: "Ver resumen parcial de ventas sin cerrar la caja" },
  { id: "corte_final", emoji: "🧾",  label: "Corte final",          desc: "Cerrar la caja y registrar el corte del día" },
  { id: "salida",      emoji: "💸",  label: "Salida de efectivo",   desc: "Registrar un egreso de efectivo con concepto y autorización" },
];

function ModalReimprimir({ onCerrar }) {
  const [folio, setFolio] = useState("");
  return (
    <div className={styles.subOverlay} onClick={onCerrar}>
      <div className={styles.subModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.subHeader}>
          <span className={styles.subTitulo}>🖨️ Reimprimir ticket</span>
          <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
        </div>
        <div className={styles.subBody}>
          <label className={styles.label}>Folio del ticket</label>
          <div className={styles.reimpRow}>
            <input
              className={styles.reimpInput}
              type="text"
              placeholder="Ej. DAN-00123"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              autoFocus
            />
            <button
              className={styles.reimpBtn}
              onClick={() => folio.trim() && window.print()}
              disabled={!folio.trim()}
            >
              Imprimir
            </button>
          </div>
          <p className={styles.reimpInfo}>La reimpresión no modifica ni duplica el folio original.</p>
        </div>
      </div>
    </div>
  );
}

function MenuF2({ onCerrar, onRecargar }) {
  const [activo, setActivo] = useState(null);

  const cerrarSub = () => setActivo(null);

  return (
    <>
      <div className={styles.overlay} onClick={onCerrar}>
        <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitulo}>
              <span className={styles.f2Badge}>F2</span>
              Menú de opciones
            </div>
            <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
          </div>

          <div className={styles.grid}>
            {OPCIONES.map((op) => (
              <button key={op.id} className={styles.opcion} onClick={() => setActivo(op.id)}>
                <span className={styles.opcionEmoji}>{op.emoji}</span>
                <div className={styles.opcionTexto}>
                  <span className={styles.opcionLabel}>{op.label}</span>
                  <span className={styles.opcionDesc}>{op.desc}</span>
                </div>
                <span className={styles.opcionArrow}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activo === "apertura"    && <ModalAperturaCaja   onCerrar={cerrarSub} onRegistrada={onRecargar} />}
      {activo === "retiro"      && <ModalRetiroEfectivo  onCerrar={cerrarSub} onRegistrado={onRecargar} />}
      {activo === "turno"       && <ModalCambioTurno      onCerrar={cerrarSub} onRegistrado={onRecargar} />}
      {activo === "descuentos"  && <ModalDescuentosActivos onCerrar={cerrarSub} />}
      {activo === "devolucion"  && <ModalDevolucion onCerrar={cerrarSub} onDevolucionRegistrada={onRecargar} />}
      {activo === "reimprimir"  && <ModalReimprimir onCerrar={cerrarSub} />}
      {activo === "facturar"    && <ModalFacturar onCerrar={cerrarSub} />}
      {activo === "precorte"    && <ModalCorte tipo="precorte"    onCerrar={cerrarSub} onCorteRegistrado={onRecargar} />}
      {activo === "corte_final" && <ModalCorte tipo="corte_final" onCerrar={cerrarSub} onCorteRegistrado={onRecargar} />}
      {activo === "salida"      && <ModalSalidaEfectivo onCerrar={cerrarSub} onRegistrada={onRecargar} />}
    </>
  );
}

export default MenuF2;
