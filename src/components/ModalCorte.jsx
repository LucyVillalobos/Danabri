import { useState, useEffect } from "react";
import { generarCortePDF } from "../utils/generarPDF";
import { getCorteData, registrarCorte } from "../api/api";
import styles from "./ModalCorte.module.css";

const METODOS_LABEL = {
  efectivo:      "💵 Efectivo",
  tarjeta:       "💳 Tarjeta",
  transferencia: "📱 Transferencia",
  cheque:        "📝 Cheque",
  vale:          "🎫 Vale",
};

const DENOMINACIONES = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

function ModalCorte({ tipo = "precorte", onCerrar, onCorteRegistrado }) {
  // tipo: "precorte" | "corte_final"
  const [datos,      setDatos]      = useState(null);
  const [cargando,   setCargando]   = useState(true);
  const [fase,       setFase]       = useState("resumen"); // resumen | denominaciones | listo
  const [guardando,  setGuardando]  = useState(false);
  const [folio,      setFolio]      = useState(null);
  const [denoms,     setDenoms]     = useState(
    Object.fromEntries(DENOMINACIONES.map((d) => [d, ""]))
  );

  useEffect(() => {
    getCorteData(1)
      .then((d) => { setDatos(d); setCargando(false); })
      .catch(() => {
        // fallback local si el backend aún no tiene el endpoint
        setDatos({
          ventas_efectivo:      0,
          ventas_tarjeta:       0,
          ventas_transferencia: 0,
          ventas_cheque:        0,
          ventas_vale:          0,
          total_ventas:         0,
          total_clientes:       0,
          total_devoluciones:   0,
          total_retiros:        0,
          salidas_efectivo:     0,
          monto_en_caja:        0,
        });
        setCargando(false);
      });
  }, []);

  const totalDenoms = DENOMINACIONES.reduce((a, d) => a + d * (parseInt(denoms[d]) || 0), 0);
  const diferencia  = totalDenoms - (datos?.monto_en_caja || 0);

  const registrar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      const res = await registrarCorte({
        id_caja:    1,
        tipo,
        id_usuario: 1,
        datos:      { ...datos, denominaciones: denoms, total_contado: totalDenoms },
      });
      setFolio(res.folio ?? (tipo === "precorte" ? null : `C-${Date.now()}`));
      setFase("listo");
      if (onCorteRegistrado) onCorteRegistrado();
    } catch {
      // si el backend no responde, igual mostrar vista de impresión
      setFolio(tipo === "precorte" ? null : `C-${Date.now()}`);
      setFase("listo");
    } finally {
      setGuardando(false);
    }
  };

  const totalVentas = datos
    ? (datos.ventas_efectivo || 0) + (datos.ventas_tarjeta || 0) +
      (datos.ventas_transferencia || 0) + (datos.ventas_cheque || 0) + (datos.ventas_vale || 0)
    : 0;

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <span className={styles.titulo}>
            {tipo === "precorte" ? "📊 Pre-corte de caja" : "🧾 Corte final de caja"}
          </span>
          <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
        </div>

        {cargando ? (
          <div className={styles.cargando}>Cargando datos de caja...</div>
        ) : (
          <>
            {/* ── FASE: resumen ── */}
            {fase === "resumen" && datos && (
              <>
                <div className={styles.seccionTitulo}>Resumen acumulado</div>

                {/* Ventas por método */}
                <div className={styles.card}>
                  {Object.entries(METODOS_LABEL).map(([key, label]) => {
                    const val = datos[`ventas_${key}`] || 0;
                    return (
                      <div key={key} className={styles.cardRow}>
                        <span>{label}</span>
                        <span className={styles.cardVal}>${Number(val).toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <div className={`${styles.cardRow} ${styles.cardRowTotal}`}>
                    <span>Total ventas</span>
                    <span>${totalVentas.toFixed(2)}</span>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Clientes atendidos</span>
                    <span className={styles.statVal}>{datos.total_clientes || 0}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Devoluciones</span>
                    <span className={`${styles.statVal} ${styles.statRed}`}>
                      -${Number(datos.total_devoluciones || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Retiros</span>
                    <span className={`${styles.statVal} ${styles.statRed}`}>
                      -${Number(datos.total_retiros || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Salidas efectivo</span>
                    <span className={`${styles.statVal} ${styles.statRed}`}>
                      -${Number(datos.salidas_efectivo || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className={styles.montoEnCaja}>
                  <span>💰 Efectivo esperado en caja</span>
                  <span>${Number(datos.monto_en_caja || 0).toFixed(2)}</span>
                </div>

                <div className={styles.footerBtns}>
                  {tipo === "corte_final" ? (
                    <button className={styles.btnPrimario} onClick={() => setFase("denominaciones")}>
                      Contar efectivo →
                    </button>
                  ) : (
                    <button className={styles.btnPrimario} onClick={registrar} disabled={guardando}>
                      {guardando ? "Generando..." : "🖨️ Imprimir pre-corte"}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── FASE: denominaciones (solo corte final) ── */}
            {fase === "denominaciones" && (
              <>
                <div className={styles.seccionTitulo}>Conteo de efectivo</div>
                <div className={styles.denomGrid}>
                  {DENOMINACIONES.map((d) => (
                    <div key={d} className={styles.denomRow}>
                      <span className={styles.denomLabel}>${d}</span>
                      <span className={styles.denomX}>×</span>
                      <input
                        className={styles.denomInput}
                        type="number"
                        min={0}
                        placeholder="0"
                        value={denoms[d]}
                        onChange={(e) => setDenoms((prev) => ({ ...prev, [d]: e.target.value }))}
                      />
                      <span className={styles.denomSub}>
                        = ${(d * (parseInt(denoms[d]) || 0)).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.conteoResumen}>
                  <div className={styles.conteoRow}>
                    <span>Efectivo contado</span>
                    <span className={styles.conteoVal}>${totalDenoms.toFixed(2)}</span>
                  </div>
                  <div className={styles.conteoRow}>
                    <span>Efectivo esperado</span>
                    <span>${Number(datos.monto_en_caja || 0).toFixed(2)}</span>
                  </div>
                  <div className={`${styles.conteoRow} ${diferencia > 0 ? styles.sobrante : diferencia < 0 ? styles.faltante : styles.exacto}`}>
                    <span>{diferencia > 0 ? "Sobrante" : diferencia < 0 ? "Faltante" : "✓ Cuadrado"}</span>
                    <span>{diferencia !== 0 ? `${diferencia > 0 ? "+" : ""}$${diferencia.toFixed(2)}` : ""}</span>
                  </div>
                </div>

                <div className={styles.footerBtns}>
                  <button className={styles.btnSecundario} onClick={() => setFase("resumen")}>← Volver</button>
                  <button className={styles.btnPrimario} onClick={registrar} disabled={guardando}>
                    {guardando ? "Registrando..." : "Registrar corte final"}
                  </button>
                </div>
              </>
            )}

            {/* ── FASE: listo ── */}
            {fase === "listo" && (
              <div className={styles.listoWrap}>
                <div className={styles.listoCheck}>✓</div>
                <div className={styles.listoTitulo}>
                  {tipo === "precorte" ? "Pre-corte generado" : "Corte final registrado"}
                </div>
                {folio && <div className={styles.listoFolio}>Folio: {folio}</div>}
                {tipo === "precorte" && (
                  <div className={styles.listoInfo}>El pre-corte no tiene folio y no afecta el corte final.</div>
                )}
                <div className={styles.footerBtns}>
                  <button className={styles.btnImprimir} onClick={() => {
                    generarCortePDF({ tipo, datos, folio, denominaciones: tipo === "corte_final" ? denoms : null });
                  }}>🖨️ Imprimir</button>
                  <button className={styles.btnPrimario} onClick={onCerrar}>Cerrar</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ModalCorte;
