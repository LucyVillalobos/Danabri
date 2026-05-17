import { useState } from "react";
import { registrarRetiro, getCorteData } from "../api/api";
import { generarRetiroPDF } from "../utils/generarPDF";
import styles from "./ModalCorte.module.css";

const DENOMS = [1000,500,200,100,50,20,10,5,2,1];

export default function ModalRetiroEfectivo({ onCerrar, onRegistrado }) {
  const [fase,       setFase]       = useState("monto"); // monto | denominaciones | listo
  const [concepto,   setConcepto]   = useState("");
  const [usarDenoms, setUsarDenoms] = useState(false);
  const [denoms,     setDenoms]     = useState(Object.fromEntries(DENOMS.map(d=>[d,""])));
  const [montoManual,setMontoManual]= useState("");
  const [guardando,  setGuardando]  = useState(false);
  const [folio,      setFolio]      = useState("");
  const [limiteInfo, setLimiteInfo] = useState(null);

  // Cargar info de caja (límite configurado)
  useState(() => {
    getCorteData(1).then(d => setLimiteInfo(d)).catch(()=>{});
  }, []);

  const totalDenoms = DENOMS.reduce((a,d) => a + d*(parseInt(denoms[d])||0), 0);
  const monto = usarDenoms ? totalDenoms : parseFloat(montoManual)||0;
  const montoEnCaja = parseFloat(limiteInfo?.monto_en_caja||0);
  const excede = monto > montoEnCaja;

  const registrar = async () => {
    if (guardando || monto <= 0) return;
    setGuardando(true);
    try {
      const res = await registrarRetiro({
        id_caja:1, id_usuario:1, monto,
        denominaciones: usarDenoms ? denoms : null,
        concepto,
      });
      const folioRes = res.folio || `RET-${Date.now()}`;
      setFolio(folioRes);
      generarRetiroPDF({ folio:folioRes, monto, concepto, denominaciones: usarDenoms?denoms:null, cajero:"Cajero activo", caja:"Caja 1" });
      setFase("listo");
      if (onRegistrado) onRegistrado();
    } catch {
      const folioLocal = `RET-${Date.now()}`;
      generarRetiroPDF({ folio:folioLocal, monto, concepto, denominaciones: usarDenoms?denoms:null, cajero:"Cajero activo", caja:"Caja 1" });
      setFolio(folioLocal);
      setFase("listo");
      if (onRegistrado) onRegistrado();
    } finally { setGuardando(false); }
  };

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={e=>e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.titulo}>💸 Retiro de efectivo</span>
          <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
        </div>

        {fase === "monto" && (
          <>
            <div className={styles.seccionTitulo}>Concepto del retiro</div>
            <input
              style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--text)",outline:"none",width:"100%"}}
              placeholder="Descripción del retiro..."
              value={concepto} onChange={e=>setConcepto(e.target.value)}
              autoFocus
            />

            <div className={styles.seccionTitulo}>Monto</div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <button
                className={!usarDenoms ? styles.btnPrimario : styles.btnSecundario}
                style={{flex:1}} onClick={()=>setUsarDenoms(false)}>
                $ Monto directo
              </button>
              <button
                className={usarDenoms ? styles.btnPrimario : styles.btnSecundario}
                style={{flex:1}} onClick={()=>setUsarDenoms(true)}>
                🪙 Por denominaciones
              </button>
            </div>

            {!usarDenoms ? (
              <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18,fontWeight:700,color:"var(--muted)"}}>$</span>
                <input
                  style={{flex:1,background:"none",border:"none",outline:"none",fontSize:28,fontWeight:900,color:"var(--text)",fontFamily:"var(--font-mono)"}}
                  type="number" min={0} value={montoManual}
                  onChange={e=>setMontoManual(e.target.value)}
                />
              </div>
            ) : (
              <div className={styles.denomGrid}>
                {DENOMS.map(d=>(
                  <div key={d} className={styles.denomRow}>
                    <span className={styles.denomLabel}>${d}</span>
                    <span className={styles.denomX}>×</span>
                    <input className={styles.denomInput} type="number" min={0} placeholder="0"
                      value={denoms[d]} onChange={e=>setDenoms(p=>({...p,[d]:e.target.value}))} />
                    <span className={styles.denomSub}>= ${(d*(parseInt(denoms[d])||0)).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}

            {monto > 0 && (
              <div style={{
                background: excede?"#fef2f2":"var(--accent-light)",
                border:`1px solid ${excede?"#fca5a5":"var(--accent)"}`,
                borderRadius:10, padding:"10px 14px",
                display:"flex", justifyContent:"space-between",
                color: excede?"var(--red)":"var(--accent)", fontWeight:700
              }}>
                <span>{excede ? "⚠ Excede el efectivo en caja" : "Monto a retirar"}</span>
                <span>${monto.toFixed(2)}</span>
              </div>
            )}

            {excede && (
              <div style={{fontSize:11,color:"var(--red)",textAlign:"center"}}>
                Efectivo disponible en caja: ${montoEnCaja.toFixed(2)}
              </div>
            )}

            <div className={styles.footerBtns}>
              <button className={styles.btnSecundario} onClick={onCerrar}>Cancelar</button>
              <button className={styles.btnPrimario} onClick={registrar}
                disabled={guardando || monto<=0 || !concepto.trim() || excede}>
                {guardando?"Registrando...":"Registrar retiro"}
              </button>
            </div>
          </>
        )}

        {fase === "listo" && (
          <div className={styles.listoWrap}>
            <div className={styles.listoCheck}>✓</div>
            <div className={styles.listoTitulo}>Retiro registrado</div>
            <div className={styles.listoFolio}>{folio}</div>
            <div style={{fontSize:22,fontWeight:900,color:"var(--red)",fontFamily:"var(--font-mono)"}}>
              -${monto.toFixed(2)}
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
