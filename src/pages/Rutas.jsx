import { useState, useEffect } from "react";
import { getClientes, getRemisiones, crearRuta } from "../api/api";
import { generarRutaPDF } from "../utils/generarPDF";
import styles from "./Remisiones.module.css";

export default function Rutas() {
  const [clientes,   setClientes]   = useState([]);
  const [remisiones, setRemisiones] = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [modalAb,    setModalAb]    = useState(false);

  // Form nueva ruta
  const [vendedor,   setVendedor]   = useState("");
  const [ciudad,     setCiudad]     = useState("");
  const [seleccion,  setSeleccion]  = useState(new Set());
  const [guardando,  setGuardando]  = useState(false);

  useEffect(() => {
    Promise.all([getClientes(), getRemisiones({ estado:"pendiente" })])
      .then(([c, r]) => { setClientes(c); setRemisiones(r); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const toggleRem = (folio) => {
    setSeleccion(prev => {
      const next = new Set(prev);
      next.has(folio) ? next.delete(folio) : next.add(folio);
      return next;
    });
  };

  const remisionesSelec = remisiones.filter(r => seleccion.has(r.folio));
  const totalImporte    = remisionesSelec.reduce((a, r) => a + parseFloat(r.total||0), 0);

  const generar = async () => {
    if (!vendedor.trim()) return alert("Ingresa el nombre del vendedor");
    if (seleccion.size === 0) return alert("Selecciona al menos una remisión");
    setGuardando(true);
    try {
      const folio = `RUT-${Date.now()}`;
      await crearRuta({ folio, vendedor, ciudad, remisiones: [...seleccion] });
      generarRutaPDF({ folio, vendedor, ciudad, remisiones: remisionesSelec });
      setModalAb(false);
      setVendedor(""); setCiudad(""); setSeleccion(new Set());
    } catch {
      // fallback — igual genera el PDF
      const folio = `RUT-${Date.now()}`;
      generarRutaPDF({ folio, vendedor, ciudad, remisiones: remisionesSelec });
      setModalAb(false);
    } finally { setGuardando(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <h1 className={styles.titulo}>🗺️ Rutas</h1>
        </div>
        <button className={styles.btnPrimario} onClick={()=>setModalAb(true)}>+ Nueva ruta</button>
      </div>

      <div className={styles.tableWrap}>
        {cargando ? (
          <div className={styles.empty}>Cargando...</div>
        ) : (
          <div className={styles.empty}>
            <span>🗺️</span>
            <span>Genera una nueva ruta para asignar remisiones a un vendedor</span>
          </div>
        )}
      </div>

      {modalAb && (
        <div className={styles.overlay} onClick={()=>setModalAb(false)}>
          <div className={styles.modal} onClick={e=>e.stopPropagation()} style={{maxWidth:600}}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitulo}>🗺️ Nueva hoja de ruta</span>
              <button className={styles.cerrarBtn} onClick={()=>setModalAb(false)}>✕</button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <label style={{fontSize:11,fontWeight:600,color:"#6b7280"}}>Vendedor *</label>
                <input
                  style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}}
                  placeholder="Nombre del vendedor"
                  value={vendedor} onChange={e=>setVendedor(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <label style={{fontSize:11,fontWeight:600,color:"#6b7280"}}>Ciudad / Destino</label>
                <input
                  style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}}
                  placeholder="León, Silao..."
                  value={ciudad} onChange={e=>setCiudad(e.target.value)}
                />
              </div>
            </div>

            <div style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".05em"}}>
              Remisiones pendientes
            </div>

            <div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
              {remisiones.length === 0 ? (
                <div className={styles.empty} style={{padding:24}}>Sin remisiones pendientes</div>
              ) : remisiones.map(r => (
                <div
                  key={r.folio}
                  onClick={() => toggleRem(r.folio)}
                  style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"8px 12px", borderRadius:10, cursor:"pointer",
                    background: seleccion.has(r.folio) ? "#fff5f1" : "#f9fafb",
                    border: `1px solid ${seleccion.has(r.folio) ? "#e8734a" : "#e5e7eb"}`,
                    transition:"all .15s",
                  }}
                >
                  <div style={{
                    width:20, height:20, borderRadius:"50%", flexShrink:0,
                    background: seleccion.has(r.folio) ? "#e8734a" : "none",
                    border: `2px solid ${seleccion.has(r.folio) ? "#e8734a" : "#d1d5db"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, fontWeight:700, color:"#fff",
                  }}>{seleccion.has(r.folio)?"✓":""}</div>
                  <span style={{flex:1,fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#e8734a"}}>{r.folio}</span>
                  <span style={{fontSize:12,color:"#374151"}}>{r.cliente||"Público General"}</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#1e3a5f",fontFamily:"monospace"}}>${parseFloat(r.total||0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {seleccion.size > 0 && (
              <div style={{display:"flex",justifyContent:"space-between",background:"#fff5f1",border:"1px solid #e8734a",borderRadius:10,padding:"10px 14px",fontWeight:700,color:"#e8734a"}}>
                <span>{seleccion.size} remisión(es) seleccionada(s)</span>
                <span>${totalImporte.toFixed(2)}</span>
              </div>
            )}

            <div className={styles.modalFooter}>
              <button className={styles.btnSecundario} onClick={()=>setModalAb(false)}>Cancelar</button>
              <button className={styles.btnPrimario} onClick={generar} disabled={guardando}>
                {guardando ? "Generando..." : "📄 Generar hoja de ruta PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
