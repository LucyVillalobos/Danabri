import { useState } from "react";
import { registrarAperturaCaja } from "../api/api";
import { generarAperturaPDF } from "../utils/generarPDF";
import styles from "./ModalCorte.module.css";

export default function ModalAperturaCaja({ onCerrar, onRegistrada }) {
  const [fondo,     setFondo]     = useState("1000");
  const [guardando, setGuardando] = useState(false);
  const [listo,     setListo]     = useState(false);
  const [folio,     setFolio]     = useState("");

  const registrar = async () => {
    if (guardando) return;
    const f = parseFloat(fondo) || 0;
    if (f <= 0) return alert("Ingresa el monto del fondo");
    setGuardando(true);
    try {
      const res = await registrarAperturaCaja({ id_caja:1, id_usuario:1, fondo:f });
      const folioRes = res.folio || `APE-${Date.now()}`;
      setFolio(folioRes);
      generarAperturaPDF({ folio:folioRes, fondo:f, cajero:"Cajero activo", caja:"Caja 1" });
      setListo(true);
      if (onRegistrada) onRegistrada();
    } catch {
      const folioLocal = `APE-${Date.now()}`;
      generarAperturaPDF({ folio:folioLocal, fondo:f, cajero:"Cajero activo", caja:"Caja 1" });
      setFolio(folioLocal);
      setListo(true);
      if (onRegistrada) onRegistrada();
    } finally { setGuardando(false); }
  };

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={e=>e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.titulo}>💰 Apertura de caja</span>
          <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
        </div>

        {!listo ? (
          <>
            <div className={styles.seccionTitulo}>Fondo inicial</div>
            <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:12,padding:"16px 20px"}}>
              <div style={{fontSize:11,color:"var(--muted)",marginBottom:8}}>Monto a registrar como fondo de caja</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20,fontWeight:700,color:"var(--muted)"}}>$</span>
                <input
                  style={{flex:1,background:"none",border:"none",outline:"none",fontSize:32,fontWeight:900,color:"var(--text)",fontFamily:"var(--font-mono)"}}
                  type="number" min={0} value={fondo}
                  onChange={e=>setFondo(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div style={{fontSize:11,color:"var(--muted)",textAlign:"center"}}>
              Este monto será excluido del cálculo de efectivo en caja durante el día
            </div>
            <div className={styles.footerBtns}>
              <button className={styles.btnSecundario} onClick={onCerrar}>Cancelar</button>
              <button className={styles.btnPrimario} onClick={registrar} disabled={guardando}>
                {guardando ? "Registrando..." : "Registrar apertura"}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.listoWrap}>
            <div className={styles.listoCheck}>✓</div>
            <div className={styles.listoTitulo}>Caja abierta</div>
            <div className={styles.listoFolio}>{folio}</div>
            <div style={{fontSize:24,fontWeight:900,color:"#16a34a",fontFamily:"var(--font-mono)"}}>
              ${parseFloat(fondo).toFixed(2)}
            </div>
            <div className={styles.footerBtns}>
              <button className={styles.btnPrimario} onClick={onCerrar}>Listo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
