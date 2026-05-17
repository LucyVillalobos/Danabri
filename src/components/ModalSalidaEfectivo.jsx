import { useState } from "react";
import { generarSalidaPDF } from "../utils/generarPDF";
import { registrarSalidaEfectivo } from "../api/api";
import styles from "./ModalSalidaEfectivo.module.css";

// Conceptos precreados — en producción vendrán del backend
const CONCEPTOS_DEFAULT = [
  "Compra de material de limpieza",
  "Pago de mensajería",
  "Compra de papelería oficina",
  "Gastos de comida personal",
  "Pago de servicios",
  "Otros gastos operativos",
];

function ModalSalidaEfectivo({ onCerrar, onRegistrada }) {
  const [concepto,    setConcepto]    = useState("");
  const [conceptoLib, setConceptoLib] = useState(""); // texto libre
  const [monto,       setMonto]       = useState("");
  const [guardando,   setGuardando]   = useState(false);
  const [resultado,   setResultado]   = useState(null);
  const [nuevoConc,   setNuevoConc]   = useState("");
  const [conceptos,   setConceptos]   = useState(CONCEPTOS_DEFAULT);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);

  const conceptoFinal = concepto === "__libre__" ? conceptoLib : concepto;
  const montoNum      = parseFloat(monto) || 0;
  const valido        = conceptoFinal.trim() && montoNum > 0;

  const guardarNuevoConcepto = () => {
    if (!nuevoConc.trim()) return;
    setConceptos((prev) => [...prev, nuevoConc.trim()]);
    setConcepto(nuevoConc.trim());
    setNuevoConc("");
    setMostrarNuevo(false);
  };

  const registrar = async () => {
    if (!valido || guardando) return;
    setGuardando(true);
    try {
      const res = await registrarSalidaEfectivo({
        id_caja:               1,
        id_usuario:            1,
        concepto:              conceptoFinal,
        monto:                 montoNum,
        requiere_autorizacion: true,
      });
      setResultado(res);
      generarSalidaPDF({ folio: res.folio, concepto: conceptoFinal, monto: montoNum });
      if (onRegistrada) onRegistrada();
    } catch {
      // fallback
      const folioLocal = `SE-${Date.now()}`;
      generarSalidaPDF({ folio: folioLocal, concepto: conceptoFinal, monto: montoNum });
      setResultado({ folio: folioLocal, concepto: conceptoFinal, monto: montoNum });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <span className={styles.titulo}>💸 Salida de efectivo</span>
          <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
        </div>

        {!resultado ? (
          <>
            <div className={styles.seccion}>
              <label className={styles.label}>Concepto</label>
              <div className={styles.conceptosGrid}>
                {conceptos.map((c) => (
                  <button
                    key={c}
                    className={`${styles.conceptoBtn} ${concepto === c ? styles.conceptoBtnActivo : ""}`}
                    onClick={() => { setConcepto(c); setConceptoLib(""); }}
                  >
                    {c}
                  </button>
                ))}
                <button
                  className={`${styles.conceptoBtn} ${concepto === "__libre__" ? styles.conceptoBtnActivo : ""}`}
                  onClick={() => setConcepto("__libre__")}
                >
                  ✏️ Otro (escribir)
                </button>
              </div>

              {concepto === "__libre__" && (
                <input
                  className={styles.inputLibre}
                  type="text"
                  placeholder="Descripción del gasto..."
                  value={conceptoLib}
                  onChange={(e) => setConceptoLib(e.target.value)}
                  autoFocus
                />
              )}

              {/* Agregar nuevo concepto permanente */}
              {!mostrarNuevo ? (
                <button className={styles.btnAgregarConc} onClick={() => setMostrarNuevo(true)}>
                  + Guardar nuevo concepto
                </button>
              ) : (
                <div className={styles.nuevoConceptoRow}>
                  <input
                    className={styles.inputLibre}
                    type="text"
                    placeholder="Nombre del nuevo concepto..."
                    value={nuevoConc}
                    onChange={(e) => setNuevoConc(e.target.value)}
                    autoFocus
                  />
                  <button className={styles.btnGuardarConc} onClick={guardarNuevoConcepto}>Guardar</button>
                  <button className={styles.btnCancelarConc} onClick={() => setMostrarNuevo(false)}>✕</button>
                </div>
              )}
            </div>

            <div className={styles.seccion}>
              <label className={styles.label}>Monto</label>
              <div className={styles.montoWrap}>
                <span className={styles.montoPrefix}>$</span>
                <input
                  className={styles.montoInput}
                  type="number"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  min={0}
                />
              </div>
            </div>

            <div className={styles.aviso}>
              ⚠️ Esta salida requiere autorización de un usuario con permisos.<br/>
              Quedará registrada en el corte de caja del día.
            </div>

            <button className={styles.btnRegistrar} onClick={registrar} disabled={!valido || guardando}>
              {guardando ? "Registrando..." : "Registrar salida"}
            </button>
          </>
        ) : (
          <div className={styles.resultadoWrap}>
            <div className={styles.resultadoCheck}>✓</div>
            <div className={styles.resultadoTitulo}>Salida registrada</div>
            <div className={styles.resultadoFolio}>Folio: {resultado.folio}</div>
            <div className={styles.resultadoDetalle}>
              <span>{resultado.concepto}</span>
              <span className={styles.resultadoMonto}>-${Number(resultado.monto).toFixed(2)}</span>
            </div>
            <div className={styles.footerBtns}>
              <button className={styles.btnImprimir} onClick={() => generarSalidaPDF({ folio: resultado.folio, concepto: resultado.concepto, monto: resultado.monto })}>🖨️ Imprimir (2 copias)</button>
              <button className={styles.btnPrimario} onClick={onCerrar}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalSalidaEfectivo;
