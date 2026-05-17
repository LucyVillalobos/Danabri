import { useState, useEffect } from "react";
import { getProductos, getClientes } from "../api/api";
import { generarCotizacionPDF } from "../utils/generarPDF";
import styles from "./CotizacionEmpresa.module.css";

const UNIDADES = ["pieza","caja","paquete","blister","rollo","metro","par"];

function ItemRow({ item, idx, onChange, onDelete, onMover, total }) {
  return (
    <tr className={styles.itemRow}>
      <td className={styles.tdDrag}>
        <div className={styles.dragBtns}>
          <button onClick={()=>onMover(idx,-1)} className={styles.dragBtn} title="Subir">▲</button>
          <button onClick={()=>onMover(idx,1)}  className={styles.dragBtn} title="Bajar">▼</button>
        </div>
      </td>
      <td>
        <input className={styles.inputDesc} value={item.nombre}
          onChange={e=>onChange(idx,"nombre",e.target.value)} placeholder="Descripción del producto" />
        {item.descripcion_req && (
          <input className={styles.inputReq} value={item.descripcion_req}
            onChange={e=>onChange(idx,"descripcion_req",e.target.value)} placeholder="Descripción según requerimiento..." />
        )}
        <button className={styles.btnReq} onClick={()=>onChange(idx,"descripcion_req",item.descripcion_req?"":"-")}>
          {item.descripcion_req ? "− Quitar req." : "+ Requerimiento"}
        </button>
      </td>
      <td>
        <select className={styles.selectUnit} value={item.unidad} onChange={e=>onChange(idx,"unidad",e.target.value)}>
          {UNIDADES.map(u=><option key={u} value={u}>{u}</option>)}
        </select>
      </td>
      <td>
        <input className={styles.inputNum} type="number" min={1} value={item.cantidad}
          onChange={e=>onChange(idx,"cantidad",parseInt(e.target.value)||1)} />
      </td>
      <td>
        <input className={styles.inputNum} type="number" min={0} step="0.01" value={item.precio_sin_iva}
          onChange={e=>{
            const v = parseFloat(e.target.value)||0;
            onChange(idx,"precio_sin_iva",v);
            onChange(idx,"precio_con_iva",parseFloat((v*1.16).toFixed(2)));
          }} placeholder="0.00" />
      </td>
      <td>
        <input className={styles.inputNum} type="number" min={0} step="0.01" value={item.precio_con_iva}
          onChange={e=>{
            const v = parseFloat(e.target.value)||0;
            onChange(idx,"precio_con_iva",v);
            onChange(idx,"precio_sin_iva",parseFloat((v/1.16).toFixed(2)));
          }} placeholder="0.00" />
      </td>
      <td className={styles.tdTotal}>${total.toFixed(2)}</td>
      <td>
        <button className={styles.btnDel} onClick={()=>onDelete(idx)}>✕</button>
      </td>
    </tr>
  );
}

export default function CotizacionEmpresa() {
  const [clientes,  setClientes]  = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [numReq,    setNumReq]    = useState("");
  const [notas,     setNotas]     = useState("");
  const [busq,      setBusq]      = useState("");
  const [items,     setItems]     = useState([]);

  useEffect(()=>{
    getClientes().then(setClientes).catch(()=>{});
    getProductos().then(prods=>{
      setProductos(prods.flatMap(p=>p.presentaciones.map(pp=>({
        id: pp.id_presentacion,
        nombre: p.nombre+(p.presentaciones.length>1?` — ${pp.nombre}`:""),
        precio_sin_iva: parseFloat((pp.precio_menudeo/1.16).toFixed(2)),
        precio_con_iva: parseFloat(pp.precio_menudeo.toFixed(2)),
        stock_tienda: pp.stock, stock_almacen: 0,
      }))));
    }).catch(()=>{});
  },[]);

  const agregarProducto = (prod) => {
    setItems(prev=>[...prev,{
      nombre: prod.nombre, descripcion_req:"", unidad:"pieza",
      cantidad:1, precio_sin_iva:prod.precio_sin_iva, precio_con_iva:prod.precio_con_iva,
      stock_tienda:prod.stock_tienda, stock_almacen:prod.stock_almacen,
    }]);
    setBusq("");
  };

  const agregarManual = () => setItems(prev=>[...prev,{
    nombre:"", descripcion_req:"", unidad:"pieza",
    cantidad:1, precio_sin_iva:0, precio_con_iva:0,
    stock_tienda:0, stock_almacen:0,
  }]);

  const onChange = (idx,k,v) => setItems(prev=>prev.map((it,i)=>i===idx?{...it,[k]:v}:it));
  const onDelete = (idx)     => setItems(prev=>prev.filter((_,i)=>i!==idx));
  const onMover  = (idx,dir) => {
    const ni = idx+dir;
    if (ni<0||ni>=items.length) return;
    const arr = [...items];
    [arr[idx],arr[ni]] = [arr[ni],arr[idx]];
    setItems(arr);
  };

  const totalSinIva = items.reduce((a,it)=>a+it.precio_sin_iva*it.cantidad,0);
  const totalConIva = items.reduce((a,it)=>a+it.precio_con_iva*it.cantidad,0);
  const iva         = totalConIva - totalSinIva;

  const clienteSelec = clientes.find(c=>String(c.id_cliente)===clienteId);

  const genPDF = (tipo) => {
    if (items.length===0) return alert("Agrega al menos un producto");
    const itemsAdapt = items.map(it=>({
      ...it,
      precio_unitario: tipo==="neto" ? it.precio_sin_iva : it.precio_con_iva,
      precio_menudeo:  tipo==="neto" ? it.precio_sin_iva : it.precio_con_iva,
    }));
    generarCotizacionPDF({
      items: itemsAdapt,
      cliente: clienteSelec || { nombre:"Cliente empresa" },
      folio: `COT-EMP-${Date.now()}`,
      subtotal: tipo==="neto" ? totalSinIva : totalConIva/1.16,
      iva:      tipo==="neto" ? 0 : iva,
      total:    tipo==="neto" ? totalSinIva : totalConIva,
      ahorro: 0,
      numReq, notas, tipo,
    });
  };

  const prodsFiltrados = productos.filter(p=>p.nombre.toLowerCase().includes(busq.toLowerCase())).slice(0,8);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <h1 className={styles.titulo}>🏢 Cotización Empresa</h1>
        </div>
        <div className={styles.topRight}>
          <button className={styles.btnSec} onClick={()=>genPDF("bruto")}>📄 PDF precios brutos</button>
          <button className={styles.btnPrim} onClick={()=>genPDF("neto")}>📄 PDF precios netos</button>
        </div>
      </div>

      <div className={styles.body}>
        {/* Datos del encabezado */}
        <div className={styles.encabezado}>
          <div className={styles.campo}>
            <label>Cliente empresa</label>
            <select value={clienteId} onChange={e=>setClienteId(e.target.value)}>
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c=><option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
            </select>
          </div>
          <div className={styles.campo}>
            <label>Número de requerimiento</label>
            <input value={numReq} onChange={e=>setNumReq(e.target.value)} placeholder="REQ-2026-001" />
          </div>
          <div className={styles.campo}>
            <label>Notas</label>
            <input value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Observaciones..." />
          </div>
        </div>

        {/* Buscador de productos */}
        <div className={styles.buscadorWrap}>
          <div className={styles.buscadorRow}>
            <input
              className={styles.buscador}
              placeholder="🔍 Buscar producto para agregar..."
              value={busq}
              onChange={e=>setBusq(e.target.value)}
            />
            <button className={styles.btnSec} onClick={agregarManual}>+ Agregar línea manual</button>
          </div>
          {busq && prodsFiltrados.length>0 && (
            <div className={styles.dropdown}>
              {prodsFiltrados.map(p=>(
                <div key={p.id} className={styles.dropItem} onClick={()=>agregarProducto(p)}>
                  <span>{p.nombre}</span>
                  <span className={styles.dropPrecio}>${p.precio_con_iva.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabla de ítems */}
        <div className={styles.tableWrap}>
          {items.length===0 ? (
            <div className={styles.empty}>
              <span>🏢</span><span>Busca productos o agrega líneas manuales</span>
            </div>
          ) : (
            <table className={styles.table}>
              <thead><tr>
                <th style={{width:50}}>Orden</th>
                <th>Descripción</th>
                <th>Unidad</th>
                <th>Cant.</th>
                <th>P. s/IVA</th>
                <th>P. c/IVA</th>
                <th>Importe</th>
                <th></th>
              </tr></thead>
              <tbody>
                {items.map((it,idx)=>(
                  <ItemRow key={idx} item={it} idx={idx}
                    onChange={onChange} onDelete={onDelete} onMover={onMover}
                    total={it.precio_con_iva*it.cantidad}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totales */}
        {items.length>0 && (
          <div className={styles.totales}>
            <div className={styles.totRow}><span>Subtotal s/IVA</span><span>${totalSinIva.toFixed(2)}</span></div>
            <div className={styles.totRow}><span>IVA (16%)</span><span>${iva.toFixed(2)}</span></div>
            <div className={`${styles.totRow} ${styles.totTotal}`}><span>Total c/IVA</span><span>${totalConIva.toFixed(2)}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
