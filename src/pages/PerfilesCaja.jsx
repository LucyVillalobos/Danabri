import { useState, useEffect } from "react";
import { getPerfilesCaja, crearPerfilCaja, actualizarPerfilCaja, eliminarPerfilCaja } from "../api/api";
import styles from "./PerfilesCaja.module.css";

const VACIO = { nombre:"", numero_caja:1, ubicacion:"", activo:true, superusuario_requerido:false };

export default function PerfilesCaja() {
  const [perfiles,  setPerfiles]  = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [modalAb,   setModalAb]   = useState(false);
  const [editando,  setEditando]  = useState(null);
  const [form,      setForm]      = useState(VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    getPerfilesCaja()
      .then(setPerfiles)
      .catch(() => setPerfiles([
        { id_caja:1, nombre:"Caja Principal", numero_caja:1, ubicacion:"Mostrador", activo:true },
        { id_caja:2, nombre:"Caja 2",         numero_caja:2, ubicacion:"Mostrador", activo:true },
      ]))
      .finally(() => setCargando(false));
  };
  useEffect(cargar, []);

  const abrirNuevo  = () => { setForm(VACIO); setEditando(null); setModalAb(true); };
  const abrirEditar = (p) => { setForm({...VACIO,...p}); setEditando(p.id_caja); setModalAb(true); };

  const guardar = async () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    setGuardando(true);
    try {
      if (editando) await actualizarPerfilCaja(editando, form);
      else          await crearPerfilCaja(form);
      setModalAb(false); cargar();
    } catch(e) { alert(e.message); }
    finally { setGuardando(false); }
  };

  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try { await eliminarPerfilCaja(p.id_caja); cargar(); }
    catch(e) { alert(e.message); }
  };

  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <h1 className={styles.titulo}>🏧 Perfiles de caja</h1>
          <span className={styles.count}>{perfiles.length} cajas configuradas</span>
        </div>
        <button className={styles.btnPrimario} onClick={abrirNuevo}>+ Nueva caja</button>
      </div>

      <div className={styles.grid}>
        {cargando ? (
          <div className={styles.empty}>Cargando cajas...</div>
        ) : perfiles.map(p => (
          <div key={p.id_caja} className={`${styles.card} ${!p.activo?styles.cardInactiva:""}`}>
            <div className={styles.cardNum}>#{p.numero_caja}</div>
            <div className={styles.cardNombre}>{p.nombre}</div>
            <div className={styles.cardUbic}>{p.ubicacion||"Sin ubicación"}</div>
            <div className={styles.cardBadges}>
              {p.activo
                ? <span className={styles.badgeActivo}>Activa</span>
                : <span className={styles.badgeInactiva}>Inactiva</span>}
              {p.superusuario_requerido && <span className={styles.badgeSup}>🔐 Superusuario</span>}
            </div>
            <div className={styles.cardAcciones}>
              <button className={styles.btnAcc} onClick={()=>abrirEditar(p)}>✏️ Editar</button>
              <button className={styles.btnAccDanger} onClick={()=>eliminar(p)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {modalAb && (
        <div className={styles.overlay} onClick={()=>setModalAb(false)}>
          <div className={styles.modal} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitulo}>{editando?"Editar caja":"Nueva caja"}</span>
              <button className={styles.cerrarBtn} onClick={()=>setModalAb(false)}>✕</button>
            </div>
            <div className={styles.campos}>
              <div className={styles.campo}>
                <label>Nombre *</label>
                <input value={form.nombre} onChange={e=>f("nombre",e.target.value)} placeholder="Caja Principal" />
              </div>
              <div className={styles.campo}>
                <label>Número de caja</label>
                <input value={form.numero_caja} onChange={e=>f("numero_caja",parseInt(e.target.value)||1)} type="number" min={1} />
              </div>
              <div className={styles.campo}>
                <label>Ubicación</label>
                <input value={form.ubicacion} onChange={e=>f("ubicacion",e.target.value)} placeholder="Mostrador, sucursal norte..." />
              </div>
              <div className={styles.checkRow}>
                <input type="checkbox" id="activo" checked={form.activo} onChange={e=>f("activo",e.target.checked)} />
                <label htmlFor="activo">Caja activa</label>
              </div>
              <div className={styles.checkRow}>
                <input type="checkbox" id="sup" checked={form.superusuario_requerido} onChange={e=>f("superusuario_requerido",e.target.checked)} />
                <label htmlFor="sup">Requiere superusuario para operar</label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecundario} onClick={()=>setModalAb(false)}>Cancelar</button>
              <button className={styles.btnPrimario} onClick={guardar} disabled={guardando}>
                {guardando?"Guardando...":editando?"Guardar cambios":"Crear caja"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
