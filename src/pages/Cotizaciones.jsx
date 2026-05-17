import { useState, useEffect } from "react";
import { getCotizaciones, getClientes, convertirCotizacionARemision } from "../api/api";
import { generarCotizacionPDF } from "../utils/generarPDF";
import { useCart } from "../components/CartContext";
import styles from "./Remisiones.module.css"; // mismo CSS

export default function Cotizaciones({ navegar }) {
  const { carrito, subtotal, iva, total, ahorro, cliente, vendedor } = useCart();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes,     setClientes]     = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [busqueda,     setBusqueda]     = useState("");
  const [convirtiendo, setConvirtiendo] = useState(null);

  const cargar = () => {
    setCargando(true);
    Promise.all([getCotizaciones(), getClientes()])
      .then(([c, cl]) => { setCotizaciones(c); setClientes(cl); })
      .catch(() => {})
      .finally(() => setCargando(false));
  };
  useEffect(cargar, []);

  const filtradas = cotizaciones.filter(c =>
    (c.folio||"").toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.cliente||"").toLowerCase().includes(busqueda.toLowerCase())
  );

  const convertir = async (c) => {
    if (!window.confirm(`¿Convertir cotización ${c.folio} a remisión?`)) return;
    setConvirtiendo(c.folio);
    try {
      await convertirCotizacionARemision(c.id_cotizacion || c.id);
      alert("✅ Remisión creada exitosamente");
      cargar();
    } catch(e) { alert("Error: " + e.message); }
    finally { setConvirtiendo(null); }
  };

  const diasRestantes = (fecha) => {
    if (!fecha) return null;
    return Math.ceil((new Date(fecha) - new Date()) / 86400000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <h1 className={styles.titulo}>📋 Cotizaciones</h1>
          <span className={styles.count}>{filtradas.length} de {cotizaciones.length}</span>
        </div>
        <div className={styles.topRight}>
          <input className={styles.search} placeholder="Buscar folio o cliente..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
        </div>
      </div>

      <div className={styles.tableWrap}>
        {cargando ? (
          <div className={styles.empty}>Cargando cotizaciones...</div>
        ) : filtradas.length === 0 ? (
          <div className={styles.empty}><span>📋</span><span>Sin cotizaciones{busqueda?" con esa búsqueda":""}</span></div>
        ) : (
          <table className={styles.table}>
            <thead><tr>
              <th>Folio</th><th>Cliente</th><th>Fecha</th>
              <th>Vigencia</th><th>Total</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {filtradas.map(c => {
                const dias = diasRestantes(c.fecha_vencimiento);
                const vencida = dias !== null && dias < 0;
                return (
                  <tr key={c.folio || c.id}>
                    <td><span className={styles.mono}>{c.folio}</span></td>
                    <td>{c.cliente || "Público General"}</td>
                    <td>{c.fecha ? new Date(c.fecha).toLocaleDateString("es-MX") : "—"}</td>
                    <td>
                      {dias !== null
                        ? <span style={{color: vencida?"#dc2626":dias<=2?"#ea580c":"#16a34a", fontWeight:700, fontSize:12}}>
                            {vencida ? "Vencida" : `${dias}d restantes`}
                          </span>
                        : "—"}
                    </td>
                    <td><span className={styles.monto}>${parseFloat(c.total||0).toFixed(2)}</span></td>
                    <td>
                      <div className={styles.acciones}>
                        <button className={styles.btnAcc} title="PDF" onClick={()=>generarCotizacionPDF({
                          items: c.items||[], cliente:{nombre:c.cliente}, folio:c.folio,
                          subtotal:parseFloat(c.total||0)/1.16, iva:parseFloat(c.total||0)/1.16*.16,
                          total:parseFloat(c.total||0), ahorro:0
                        })}>📋</button>
                        <button
                          className={styles.btnAcc}
                          title="Convertir a remisión"
                          disabled={vencida || convirtiendo===c.folio}
                          onClick={()=>convertir(c)}
                        >📄→</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
