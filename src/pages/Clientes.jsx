import { useState, useEffect } from "react";
import { getClientes, crearCliente, actualizarCliente, getHistorialCliente } from "../api/api";
import { RUTAS } from "../rutas";
import styles from "./Clientes.module.css";

const USOS_CFDI = ["G01","G02","G03","I01","I04","S01","CP01"];
const TIPOS = ["menudeo","mayoreo","empresa","credito"];

const VACIO = {
  nombre:"", rfc:"", email:"", telefono:"", giro:"",
  tipo_cliente:"menudeo", uso_cfdi:"G03",
  calle:"", num_ext:"", num_int:"", colonia:"", cp:"",
  ciudad:"", estado:"Mexico", condiciones_pago:"",
  limite_credito:"", notas:"",
};

function Badge({ tipo }) {
  const col = { menudeo:"#2563eb", mayoreo:"#16a34a", empresa:"#7c3aed", credito:"#ea580c" };
  return (
    <span style={{ background: col[tipo]+"18", color: col[tipo], fontSize:10, fontWeight:700,
      padding:"2px 8px", borderRadius:20, textTransform:"capitalize" }}>{tipo}</span>
  );
}

export default function Clientes({ navegar }) {
  const [clientes,   setClientes]   = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [busqueda,   setBusqueda]   = useState("");
  const [modalAb,    setModalAb]    = useState(false);
  const [editando,   setEditando]   = useState(null);
  const [form,       setForm]       = useState(VACIO);
  const [guardando,  setGuardando]  = useState(false);
  const [historial,  setHistorial]  = useState(null);
  const [clienteHist, setClienteHist] = useState(null);
  const [cargHist,   setCargHist]   = useState(false);

  const cargar = () => {
    setCargando(true);
    getClientes().then(setClientes).catch(()=>setClientes([])).finally(()=>setCargando(false));
  };
  useEffect(cargar, []);

  const filtrados = clientes.filter(c =>
    (c.nombre||"").toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.rfc||"").toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.email||"").toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirNuevo = () => { setForm(VACIO); setEditando(null); setModalAb(true); };
  const abrirEditar = (c) => {
    setForm({ ...VACIO, ...c });
    setEditando(c.id_cliente);
    setModalAb(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    setGuardando(true);
    try {
      if (editando) await actualizarCliente(editando, form);
      else          await crearCliente(form);
      setModalAb(false);
      cargar();
    } catch(e) { alert(e.message); }
    finally { setGuardando(false); }
  };

  const verHistorial = async (c) => {
    setClienteHist(c);
    setCargHist(true);
    setHistorial(null);
    try {
      const data = await getHistorialCliente(c.id_cliente);
      setHistorial(data);
    } catch { setHistorial({ ventas:[], remisiones:[], cotizaciones:[] }); }
    finally { setCargHist(false); }
  };

  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <h1 className={styles.titulo}>👥 Clientes</h1>
          <span className={styles.count}>{filtrados.length} de {clientes.length}</span>
        </div>
        <div className={styles.topRight}>
          <input
            className={styles.search}
            placeholder="Buscar por nombre, RFC o email..."
            value={busqueda}
            onChange={e=>setBusqueda(e.target.value)}
          />
          <button className={styles.btnPrimario} onClick={abrirNuevo}>+ Nuevo cliente</button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className={styles.tableWrap}>
        {cargando ? (
          <div className={styles.empty}>Cargando clientes...</div>
        ) : filtrados.length === 0 ? (
          <div className={styles.empty}><span>👥</span><span>Sin clientes{busqueda ? " con esa búsqueda" : ""}</span></div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th><th>RFC</th><th>Tipo</th>
                <th>Teléfono</th><th>Email</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id_cliente}>
                  <td className={styles.tdNombre}>
                    <div className={styles.avatar}>{(c.nombre||"?")[0]}</div>
                    <div>
                      <div className={styles.nombre}>{c.nombre}</div>
                      <div className={styles.ciudad}>{[c.ciudad, c.estado].filter(Boolean).join(", ")}</div>
                    </div>
                  </td>
                  <td><span className={styles.mono}>{c.rfc||"—"}</span></td>
                  <td><Badge tipo={c.tipo_cliente||"menudeo"} /></td>
                  <td>{c.telefono||"—"}</td>
                  <td>{c.email||"—"}</td>
                  <td>
                    <div className={styles.acciones}>
                      <button className={styles.btnAcc} onClick={()=>abrirEditar(c)} title="Editar">✏️</button>
                      <button className={styles.btnAcc} onClick={()=>verHistorial(c)} title="Historial">📋</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal formulario ── */}
      {modalAb && (
        <div className={styles.overlay} onClick={()=>setModalAb(false)}>
          <div className={styles.modal} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitulo}>{editando ? "Editar cliente" : "Nuevo cliente"}</span>
              <button className={styles.cerrarBtn} onClick={()=>setModalAb(false)}>✕</button>
            </div>

            <div className={styles.grid2}>
              <div className={styles.campo}>
                <label>Nombre *</label>
                <input value={form.nombre} onChange={e=>f("nombre",e.target.value)} placeholder="Nombre completo o razón social" />
              </div>
              <div className={styles.campo}>
                <label>RFC</label>
                <input value={form.rfc} onChange={e=>f("rfc",e.target.value.toUpperCase())} placeholder="XAXX010101000" maxLength={13} />
              </div>
              <div className={styles.campo}>
                <label>Tipo de cliente *</label>
                <select value={form.tipo_cliente} onChange={e=>f("tipo_cliente",e.target.value)}>
                  {TIPOS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div className={styles.campo}>
                <label>Uso de CFDI</label>
                <select value={form.uso_cfdi} onChange={e=>f("uso_cfdi",e.target.value)}>
                  {USOS_CFDI.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className={styles.campo}>
                <label>Teléfono</label>
                <input value={form.telefono} onChange={e=>f("telefono",e.target.value)} placeholder="477-XXX-XXXX" />
              </div>
              <div className={styles.campo}>
                <label>Email</label>
                <input value={form.email} onChange={e=>f("email",e.target.value)} placeholder="correo@empresa.com" type="email" />
              </div>
              <div className={styles.campo}>
                <label>Giro / Actividad</label>
                <input value={form.giro} onChange={e=>f("giro",e.target.value)} placeholder="Papelería, escuela, empresa..." />
              </div>
              <div className={styles.campo}>
                <label>Condiciones de pago</label>
                <input value={form.condiciones_pago} onChange={e=>f("condiciones_pago",e.target.value)} placeholder="Crédito 30 días, contado..." />
              </div>
              <div className={styles.campo}>
                <label>Límite de crédito ($)</label>
                <input value={form.limite_credito} onChange={e=>f("limite_credito",e.target.value)} type="number" min={0} placeholder="0.00" />
              </div>
            </div>

            <div className={styles.secLabel}>Dirección</div>
            <div className={styles.grid3}>
              <div className={`${styles.campo} ${styles.span2}`}>
                <label>Calle</label>
                <input value={form.calle} onChange={e=>f("calle",e.target.value)} placeholder="Av. Principal" />
              </div>
              <div className={styles.campo}>
                <label>Núm. ext.</label>
                <input value={form.num_ext} onChange={e=>f("num_ext",e.target.value)} placeholder="123" />
              </div>
              <div className={styles.campo}>
                <label>Núm. int.</label>
                <input value={form.num_int} onChange={e=>f("num_int",e.target.value)} placeholder="A" />
              </div>
              <div className={styles.campo}>
                <label>Colonia</label>
                <input value={form.colonia} onChange={e=>f("colonia",e.target.value)} placeholder="Col. Centro" />
              </div>
              <div className={styles.campo}>
                <label>C.P.</label>
                <input value={form.cp} onChange={e=>f("cp",e.target.value)} placeholder="37000" maxLength={5} />
              </div>
              <div className={styles.campo}>
                <label>Ciudad</label>
                <input value={form.ciudad} onChange={e=>f("ciudad",e.target.value)} placeholder="León" />
              </div>
              <div className={styles.campo}>
                <label>Estado</label>
                <input value={form.estado} onChange={e=>f("estado",e.target.value)} placeholder="Guanajuato" />
              </div>
            </div>

            <div className={styles.campo} style={{marginTop:8}}>
              <label>Notas internas</label>
              <textarea value={form.notas} onChange={e=>f("notas",e.target.value)} rows={2} placeholder="Observaciones, referencias, etc." />
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecundario} onClick={()=>setModalAb(false)}>Cancelar</button>
              <button className={styles.btnPrimario} onClick={guardar} disabled={guardando}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Panel historial ── */}
      {clienteHist && (
        <div className={styles.overlay} onClick={()=>setClienteHist(null)}>
          <div className={styles.modal} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitulo}>📋 Historial — {clienteHist.nombre}</span>
              <button className={styles.cerrarBtn} onClick={()=>setClienteHist(null)}>✕</button>
            </div>
            {cargHist ? (
              <div className={styles.empty}>Cargando historial...</div>
            ) : historial ? (
              <div className={styles.histWrap}>
                <div className={styles.histSec}>
                  <div className={styles.histLabel}>🛒 Ventas ({(historial.ventas||[]).length})</div>
                  {(historial.ventas||[]).length === 0
                    ? <div className={styles.histEmpty}>Sin ventas registradas</div>
                    : (historial.ventas||[]).map(v=>(
                      <div key={v.folio} className={styles.histRow}>
                        <span className={styles.mono}>{v.folio}</span>
                        <span>{new Date(v.created_at).toLocaleDateString("es-MX")}</span>
                        <span>{v.metodo_pago}</span>
                        <span className={styles.histMonto}>${parseFloat(v.total).toFixed(2)}</span>
                      </div>
                    ))
                  }
                </div>
                <div className={styles.histSec}>
                  <div className={styles.histLabel}>📄 Remisiones ({(historial.remisiones||[]).length})</div>
                  {(historial.remisiones||[]).length === 0
                    ? <div className={styles.histEmpty}>Sin remisiones</div>
                    : (historial.remisiones||[]).map(r=>(
                      <div key={r.folio} className={styles.histRow}>
                        <span className={styles.mono}>{r.folio}</span>
                        <span>{new Date(r.fecha).toLocaleDateString("es-MX")}</span>
                        <span className={r.pagada?"histPagado":"histPendiente"}>{r.pagada?"Pagada":"Pendiente"}</span>
                        <span className={styles.histMonto}>${parseFloat(r.total).toFixed(2)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
