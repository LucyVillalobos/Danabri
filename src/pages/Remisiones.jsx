import { useState, useEffect } from "react";
import { getRemisiones, getClientes, getRemision } from "../api/api";
import { generarRemisionPDF } from "../utils/generarPDF";
import styles from "./Remisiones.module.css";

const ESTADOS = ["todos","pendiente","pagada","vencida"];

export default function Remisiones() {
  const [remisiones, setRemisiones] = useState([]);
  const [clientes,   setClientes]   = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [busqueda,   setBusqueda]   = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [detalle,    setDetalle]    = useState(null);
  const [cargDet,    setCargDet]    = useState(false);

  const cargar = () => {
    setCargando(true);
    Promise.all([getRemisiones(), getClientes()])
      .then(([r, c]) => { setRemisiones(r); setClientes(c); })
      .catch(() => {})
      .finally(() => setCargando(false));
  };
  useEffect(cargar, []);

  const filtradas = remisiones.filter(r => {
    const matchBusq    = (r.folio||"").toLowerCase().includes(busqueda.toLowerCase()) ||
                         (r.cliente||"").toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado  = filtroEstado === "todos" || r.estado === filtroEstado;
    const matchCliente = !filtroCliente || String(r.id_cliente) === filtroCliente;
    return matchBusq && matchEstado && matchCliente;
  });

  const verDetalle = async (r) => {
    setCargDet(true); setDetalle(null);
    try { setDetalle(await getRemision(r.id_venta || r.id)); }
    catch { setDetalle(r); }
    finally { setCargDet(false); }
  };

  const totalPendiente = remisiones
    .filter(r => r.estado === "pendiente")
    .reduce((a, r) => a + parseFloat(r.total||0), 0);

  const estadoBadge = (e) => {
    const map = { pagada:["#f0fdf4","#16a34a"], pendiente:["#fff7ed","#ea580c"], vencida:["#fef2f2","#dc2626"] };
    const [bg, col] = map[e] || ["#f3f4f6","#6b7280"];
    return <span style={{ background:bg, color:col, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{e}</span>;
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <h1 className={styles.titulo}>📄 Remisiones</h1>
          <span className={styles.count}>{filtradas.length} de {remisiones.length}</span>
          {totalPendiente > 0 && (
            <span className={styles.alertPend}>⚠ ${totalPendiente.toFixed(2)} pendiente</span>
          )}
        </div>
        <div className={styles.topRight}>
          <input className={styles.search} placeholder="Buscar folio o cliente..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
          <select className={styles.filtro} value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}>
            <option value="">Todos los clientes</option>
            {clientes.map(c=><option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
          </select>
          <div className={styles.estadoFiltros}>
            {ESTADOS.map(e=>(
              <button key={e} className={`${styles.estadoBtn} ${filtroEstado===e?styles.estadoBtnActivo:""}`} onClick={()=>setFiltroEstado(e)}>
                {e.charAt(0).toUpperCase()+e.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {cargando ? (
          <div className={styles.empty}>Cargando remisiones...</div>
        ) : filtradas.length === 0 ? (
          <div className={styles.empty}><span>📄</span><span>Sin remisiones</span></div>
        ) : (
          <table className={styles.table}>
            <thead><tr>
              <th>Folio</th><th>Cliente</th><th>Fecha</th>
              <th>Vence</th><th>Total</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {filtradas.map(r => (
                <tr key={r.folio || r.id_venta}>
                  <td><span className={styles.mono}>{r.folio}</span></td>
                  <td>{r.cliente || "Público General"}</td>
                  <td>{r.fecha ? new Date(r.fecha).toLocaleDateString("es-MX") : new Date(r.created_at).toLocaleDateString("es-MX")}</td>
                  <td>{r.fecha_vencimiento ? new Date(r.fecha_vencimiento).toLocaleDateString("es-MX") : "—"}</td>
                  <td><span className={styles.monto}>${parseFloat(r.total).toFixed(2)}</span></td>
                  <td>{estadoBadge(r.estado || "pendiente")}</td>
                  <td>
                    <div className={styles.acciones}>
                      <button className={styles.btnAcc} onClick={()=>verDetalle(r)} title="Ver detalle">👁️</button>
                      <button className={styles.btnAcc} onClick={()=>generarRemisionPDF({
                        items: r.items||[], cliente: { nombre: r.cliente }, folio: r.folio,
                        subtotal: parseFloat(r.total)/1.16, iva: parseFloat(r.total)/1.16*.16,
                        total: parseFloat(r.total), pagos:[], ahorro:0
                      })} title="PDF">📄</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detalle */}
      {(detalle || cargDet) && (
        <div className={styles.overlay} onClick={()=>setDetalle(null)}>
          <div className={styles.modal} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitulo}>📄 {detalle?.folio}</span>
              <button className={styles.cerrarBtn} onClick={()=>setDetalle(null)}>✕</button>
            </div>
            {cargDet ? <div className={styles.empty}>Cargando...</div> : detalle && (
              <>
                <div className={styles.detalleInfo}>
                  <div><span>Cliente</span><strong>{detalle.cliente||"Público General"}</strong></div>
                  <div><span>Fecha</span><strong>{detalle.fecha||detalle.created_at ? new Date(detalle.fecha||detalle.created_at).toLocaleDateString("es-MX") : "—"}</strong></div>
                  <div><span>Estado</span>{estadoBadge(detalle.estado||"pendiente")}</div>
                  <div><span>Total</span><strong className={styles.monto}>${parseFloat(detalle.total||0).toFixed(2)}</strong></div>
                </div>
                {(detalle.items||[]).length > 0 && (
                  <table className={styles.table}>
                    <thead><tr><th>Producto</th><th>Cant.</th><th>P.Unit.</th><th>Importe</th></tr></thead>
                    <tbody>
                      {detalle.items.map((it,i)=>(
                        <tr key={i}>
                          <td>{it.nombre}</td>
                          <td>{it.cantidad}</td>
                          <td>${parseFloat(it.precio_unitario||0).toFixed(2)}</td>
                          <td>${(it.cantidad*parseFloat(it.precio_unitario||0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className={styles.modalFooter}>
                  <button className={styles.btnPrimario} onClick={()=>generarRemisionPDF({
                    items: detalle.items||[], cliente:{nombre:detalle.cliente}, folio:detalle.folio,
                    subtotal:parseFloat(detalle.total||0)/1.16, iva:parseFloat(detalle.total||0)/1.16*.16,
                    total:parseFloat(detalle.total||0), pagos:detalle.pagos||[], ahorro:0
                  })}>📄 Generar PDF</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
