import { useState, useEffect } from "react";
import { getVentasDia, getResumenDia } from "../api/api";
import { useCart } from "./CartContext";
import styles from "./HistorialVentas.module.css";

const METODO_EMOJI = { efectivo: "💵", tarjeta: "💳", transferencia: "📱", vale: "🎫" };
const HORAS = Array.from({ length: 13 }, (_, i) => i + 8);

function GraficaHoras({ ventas }) {
  const ventasPorHora = HORAS.reduce((acc, h) => ({ ...acc, [h]: 0 }), {});

  ventas.forEach((v) => {
    const fecha = new Date(v.created_at);
    const hora  = fecha.getHours();
    if (ventasPorHora[hora] !== undefined) {
      ventasPorHora[hora] += parseFloat(v.total);
    }
  });

  const maxVal = Math.max(...Object.values(ventasPorHora), 1);

  return (
    <div className={styles.grafica}>
      <div className={styles.graficaBars}>
        {HORAS.map((h) => {
          const val = ventasPorHora[h];
          const pct = Math.round((val / maxVal) * 100);
          const horaLabel = h <= 12 ? `${h}am` : `${h - 12}pm`;
          return (
            <div key={h} className={styles.barCol}>
              <div className={styles.barWrap}>
                {val > 0 && <span className={styles.barTooltip}>${Math.round(val)}</span>}
                <div className={styles.bar} style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }} />
              </div>
              <span className={styles.barLabel}>{horaLabel}</span>
            </div>
          );
        })}
      </div>
      {ventas.length === 0 && <div className={styles.graficaEmpty}>Sin ventas aún</div>}
    </div>
  );
}

function HistorialVentas({ onCerrar }) {
  const [ventas,   setVentas]   = useState([]);
  const [resumen,  setResumen]  = useState({ ventas_hoy: 0, total_ventas: 0, productos_vendidos: 0 });
  const [cargando, setCargando] = useState(true);
  const { historial } = useCart() ?? {};

  useEffect(() => {
    setCargando(true);
    Promise.all([getVentasDia(), getResumenDia()])
      .then(([ventasData, resumenData]) => {
        setVentas(ventasData);
        setResumen(resumenData);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [historial]); // se recarga cuando hay una venta nueva

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <span className={styles.titulo}>Ventas del día</span>
          <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
        </div>

        <div className={styles.scroll}>
          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total recaudado</span>
              <span className={styles.statVal}>${Number(resumen.ventas_hoy || 0).toFixed(2)}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Órdenes</span>
              <span className={styles.statVal}>{resumen.total_ventas || 0}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Productos</span>
              <span className={styles.statVal}>{resumen.productos_vendidos || 0}</span>
            </div>
          </div>

          {/* Gráfica */}
          <div className={styles.seccion}>
            <span className={styles.seccionTitulo}>Ventas por hora</span>
            <GraficaHoras ventas={ventas} />
          </div>

          {/* Lista */}
          <div className={styles.seccion}>
            <span className={styles.seccionTitulo}>Órdenes</span>
            {cargando ? (
              <div className={styles.empty}>
                <span className={styles.emptyText}>Cargando...</span>
              </div>
            ) : ventas.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🧾</span>
                <span className={styles.emptyText}>Sin ventas aún hoy</span>
              </div>
            ) : (
              ventas.map((venta, i) => (
                <div key={i} className={styles.venta}>
                  <div className={styles.ventaTop}>
                    <div className={styles.ventaInfo}>
                      <span className={styles.ventaCliente}>{venta.cliente || "Cliente General"}</span>
                      <span className={styles.ventaHora}>
                        {new Date(venta.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}{venta.folio}
                      </span>
                    </div>
                    <div className={styles.ventaRight}>
                      <span className={styles.ventaMetodo}>
                        {METODO_EMOJI[venta.metodo_pago]} {venta.metodo_pago}
                      </span>
                      <span className={styles.ventaTotal}>${Number(venta.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistorialVentas;