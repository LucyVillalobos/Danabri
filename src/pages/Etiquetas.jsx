import { useState, useEffect } from "react";
import { getProductos } from "../api/api";
import styles from "./Etiquetas.module.css";

export default function Etiquetas() {
  const [productos,  setProductos]  = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [busqueda,   setBusqueda]   = useState("");
  const [seleccion,  setSeleccion]  = useState(new Set()); // Set de id_presentacion
  const [tamanio,    setTamanio]    = useState("chica"); // chica | mediana | grande

  useEffect(() => {
    getProductos()
      .then(prods => {
        const flat = prods.flatMap(p => p.presentaciones.map(pp => ({
          id: pp.id_presentacion,
          nombre: p.nombre + (p.presentaciones.length > 1 ? ` — ${pp.nombre}` : ""),
          codigo_barras: pp.codigo_barras || "",
          precio_menudeo: pp.precio_menudeo,
          precio_mayoreo: pp.precio_mayoreo,
          categoria: p.categoria,
        })));
        setProductos(flat);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo_barras.includes(busqueda)
  );

  const toggle = (id) => {
    setSeleccion(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const seleccionarTodos = () => setSeleccion(new Set(filtrados.map(p=>p.id)));
  const limpiarSeleccion = () => setSeleccion(new Set());

  const seleccionados = productos.filter(p => seleccion.has(p.id));

  const imprimir = () => {
    if (seleccionados.length === 0) return alert("Selecciona al menos un producto");
    const win = window.open("", "_blank", "width=900,height=700");
    const dim = { chica:{w:"60mm",h:"40mm",fs:"11px"}, mediana:{w:"80mm",h:"50mm",fs:"13px"}, grande:{w:"100mm",h:"60mm",fs:"15px"} };
    const d = dim[tamanio];
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Etiquetas</title><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;background:#fff}
      .grid{display:flex;flex-wrap:wrap;gap:4mm;padding:8mm}
      .etiqueta{width:${d.w};height:${d.h};border:1px solid #d1d5db;border-radius:4px;padding:4px 6px;display:flex;flex-direction:column;justify-content:space-between;page-break-inside:avoid}
      .negocio{font-size:8px;font-weight:700;color:#1e3a5f;text-transform:uppercase}
      .nombre{font-size:${d.fs};font-weight:700;color:#111827;line-height:1.2;flex:1;display:flex;align-items:center}
      .precios{display:flex;justify-content:space-between;align-items:flex-end}
      .precio-men{font-size:${d.fs};font-weight:900;color:#e8734a}
      .precio-may{font-size:9px;color:#6b7280}
      .codigo{font-size:8px;color:#6b7280;font-family:monospace}
      @media print{body{margin:0}.no-print{display:none}}
    </style></head><body>
    <div class="no-print" style="padding:12px;display:flex;gap:8px">
      <button onclick="window.print()" style="padding:8px 18px;background:#e8734a;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px">🖨️ Imprimir</button>
      <button onclick="window.close()" style="padding:8px 18px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;cursor:pointer">✕ Cerrar</button>
    </div>
    <div class="grid">
      ${seleccionados.map(p=>`
        <div class="etiqueta">
          <div class="negocio">PAPELERÍA DANABRI</div>
          <div class="nombre">${p.nombre}</div>
          <div class="precios">
            <div>
              <div class="precio-men">$${Number(p.precio_menudeo).toFixed(2)}</div>
              ${p.precio_mayoreo ? `<div class="precio-may">Mayor: $${Number(p.precio_mayoreo).toFixed(2)}</div>` : ""}
            </div>
            ${p.codigo_barras ? `<div class="codigo">${p.codigo_barras}</div>` : ""}
          </div>
        </div>`).join("")}
    </div>
    </body></html>`);
    win.document.close(); win.focus();
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <h1 className={styles.titulo}>🏷️ Etiquetas de precio</h1>
          <span className={styles.count}>{seleccion.size} seleccionados</span>
        </div>
        <div className={styles.topRight}>
          <input className={styles.search} placeholder="Buscar producto o código..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
          <select className={styles.filtro} value={tamanio} onChange={e=>setTamanio(e.target.value)}>
            <option value="chica">Etiqueta chica (60×40mm)</option>
            <option value="mediana">Etiqueta mediana (80×50mm)</option>
            <option value="grande">Etiqueta grande (100×60mm)</option>
          </select>
          <button className={styles.btnSecundario} onClick={seleccionarTodos}>Seleccionar todos</button>
          <button className={styles.btnSecundario} onClick={limpiarSeleccion}>Limpiar</button>
          <button className={styles.btnPrimario} onClick={imprimir} disabled={seleccion.size===0}>
            🖨️ Imprimir {seleccion.size>0?`(${seleccion.size})`:""}
          </button>
        </div>
      </div>

      {/* Preview de etiquetas seleccionadas */}
      {seleccion.size > 0 && (
        <div className={styles.preview}>
          <div className={styles.previewLabel}>Vista previa — {seleccion.size} etiqueta(s)</div>
          <div className={styles.previewGrid}>
            {seleccionados.map(p=>(
              <div key={p.id} className={styles.etiqueta}>
                <div className={styles.etNegocio}>PAPELERÍA DANABRI</div>
                <div className={styles.etNombre}>{p.nombre}</div>
                <div className={styles.etPrecios}>
                  <span className={styles.etPrecioMen}>${Number(p.precio_menudeo).toFixed(2)}</span>
                  {p.precio_mayoreo && <span className={styles.etPrecioMay}>Mayor: ${Number(p.precio_mayoreo).toFixed(2)}</span>}
                </div>
                {p.codigo_barras && <div className={styles.etCodigo}>{p.codigo_barras}</div>}
                <button className={styles.etQuitar} onClick={()=>toggle(p.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de productos */}
      <div className={styles.tableWrap}>
        {cargando ? (
          <div className={styles.empty}>Cargando productos...</div>
        ) : (
          <table className={styles.table}>
            <thead><tr>
              <th style={{width:40}}></th>
              <th>Producto</th><th>Código</th>
              <th>P. Menudeo</th><th>P. Mayoreo</th>
            </tr></thead>
            <tbody>
              {filtrados.map(p=>(
                <tr key={p.id} className={seleccion.has(p.id)?styles.rowSelected:""} onClick={()=>toggle(p.id)} style={{cursor:"pointer"}}>
                  <td>
                    <div className={`${styles.check} ${seleccion.has(p.id)?styles.checkActivo:""}`}>
                      {seleccion.has(p.id)?"✓":""}
                    </div>
                  </td>
                  <td><span className={styles.prodNombre}>{p.nombre}</span></td>
                  <td><span className={styles.mono}>{p.codigo_barras||"—"}</span></td>
                  <td><span className={styles.monto}>${Number(p.precio_menudeo).toFixed(2)}</span></td>
                  <td><span className={styles.montoMay}>${Number(p.precio_mayoreo||0).toFixed(2)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
