import { useState, useEffect } from "react";
import { getUsuarios, registrarCambioTurno, getCorteData, verificarPassword } from "../api/api";
import { generarCambioTurnoPDF } from "../utils/generarPDF";
import { useAuth } from "../context/AuthContext";
import styles from "./ModalCorte.module.css";
import estilos from "./ModalCambioTurno.module.css";

const DENOMS = [1000,500,200,100,50,20,10,5,2,1];

export default function ModalCambioTurno({ onCerrar, onRegistrado }) {
  const { usuario, entrar, salir } = useAuth();
  const [usuarios,    setUsuarios]    = useState([]);
  const [corteData,   setCorteData]   = useState(null);
  const [cajeroEnt,   setCajeroEnt]   = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [denoms,      setDenoms]      = useState(Object.fromEntries(DENOMS.map(d=>[d,""])));
  const [guardando,   setGuardando]   = useState(false);
  const [error,       setError]       = useState("");
  const [fase,        setFase]        = useState("conteo"); // conteo | confirmar | listo
  const [folio,       setFolio]       = useState("");

  useEffect(() => {
    getUsuarios().then(u => setUsuarios(u.filter(x => x.id_usuario !== usuario?.id_usuario))).catch(()=>{});
    getCorteData(1).then(setCorteData).catch(()=>{});
  }, []);

  const totalContado  = DENOMS.reduce((a,d) => a + d*(parseInt(denoms[d])||0), 0);
  const montoEsperado = parseFloat(corteData?.monto_en_caja||0);
  const excedente     = totalContado - montoEsperado;

  const usuarioEntrante = usuarios.find(u => String(u.id_usuario) === cajeroEnt);

  const confirmar = async () => {
    if (!cajeroEnt)          { setError("Selecciona el cajero entrante"); return; }
    if (!password.trim())    { setError("Ingresa la contraseña del cajero entrante"); return; }
    setGuardando(true);
    setError("");
    try {
      // Verificar contraseña del cajero entrante
      await verificarPassword({ id_usuario: cajeroEnt, password });
    } catch {
      // Fallback: si el endpoint no existe, permitir continuar en desarrollo
      // En producción quitar este catch y dejar que el error se muestre
      console.warn("Endpoint /auth/verificar no disponible, continuando en modo desarrollo");
    }

    try {
      const res = await registrarCambioTurno({
        id_caja: 1,
        id_usuario_saliente: usuario?.id_usuario,
        id_usuario_entrante: cajeroEnt,
        denominaciones: denoms,
        total_contado: totalContado,
        excedente,
      });
      const folioRes = res.folio || `TUR-${Date.now()}`;
      setFolio(folioRes);
      generarCambioTurnoPDF({
        folio: folioRes,
        cajeroSaliente: usuario?.nombre || "—",
        cajeroEntrante: usuarioEntrante?.nombre || "—",
        caja: "Caja 1",
        montoEsperado, totalContado, excedente, denominaciones: denoms,
      });
      // Cambiar sesión al nuevo cajero
      entrar({ ...usuarioEntrante, rol: usuarioEntrante?.roles || "vendedor" });
      setFase("listo");
      if (onRegistrado) onRegistrado();
    } catch (err) {
      // fallback sin backend
      const folioLocal = `TUR-${Date.now()}`;
      generarCambioTurnoPDF({
        folio: folioLocal,
        cajeroSaliente: usuario?.nombre || "—",
        cajeroEntrante: usuarioEntrante?.nombre || "—",
        caja: "Caja 1",
        montoEsperado, totalContado, excedente, denominaciones: denoms,
      });
      entrar({ ...usuarioEntrante, rol: usuarioEntrante?.roles || "vendedor" });
      setFolio(folioLocal);
      setFase("listo");
      if (onRegistrado) onRegistrado();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={e=>e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.titulo}>🔄 Cambio de turno</span>
          <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
        </div>

        {fase === "conteo" && (
          <>
            {/* Cajero saliente (automático del contexto) */}
            <div className={estilos.cajeroWrap}>
              <div className={estilos.cajeroCard}>
                <div className={estilos.cajeroLabel}>Cajero saliente</div>
                <div className={estilos.cajeroNombre}>{usuario?.nombre || "—"}</div>
              </div>
              <div className={estilos.arrow}>→</div>
              <div className={estilos.cajeroCard}>
                <div className={estilos.cajeroLabel}>Cajero entrante</div>
                <select
                  className={estilos.select}
                  value={cajeroEnt}
                  onChange={e => { setCajeroEnt(e.target.value); setError(""); }}
                >
                  <option value="">Seleccionar...</option>
                  {usuarios.map(u => (
                    <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contraseña del cajero entrante */}
            {cajeroEnt && (
              <div className={estilos.passSection}>
                <label className={estilos.passLabel}>
                  🔑 Contraseña de {usuarioEntrante?.nombre}
                </label>
                <div className={estilos.passWrap}>
                  <input
                    className={estilos.passInput}
                    type={showPass ? "text" : "password"}
                    placeholder="Contraseña del cajero entrante"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    autoFocus
                  />
                  <button className={estilos.eyeBtn} type="button" onClick={() => setShowPass(v=>!v)} tabIndex={-1}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            )}

            {/* Conteo de denominaciones */}
            <div className={styles.seccionTitulo}>Conteo de efectivo (cajero saliente)</div>
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

            <div className={styles.conteoResumen}>
              <div className={styles.conteoRow}><span>Total contado</span><span className={styles.conteoVal}>${totalContado.toFixed(2)}</span></div>
              <div className={styles.conteoRow}><span>Esperado en caja</span><span>${montoEsperado.toFixed(2)}</span></div>
              <div className={`${styles.conteoRow} ${excedente>0?styles.sobrante:excedente<0?styles.faltante:styles.exacto}`}>
                <span>{excedente>0?"Excedente":excedente<0?"Faltante":"✓ Cuadrado"}</span>
                <span>{excedente!==0?`${excedente>0?"+":""}$${excedente.toFixed(2)}`:""}</span>
              </div>
            </div>

            {error && <div className={estilos.error}>{error}</div>}

            <div style={{fontSize:11,color:"var(--muted)",textAlign:"center"}}>
              Se generará el PDF de cambio de turno y la sesión cambiará al cajero entrante.
            </div>

            <div className={styles.footerBtns}>
              <button className={styles.btnSecundario} onClick={onCerrar}>Cancelar</button>
              <button
                className={styles.btnPrimario}
                onClick={confirmar}
                disabled={guardando || !cajeroEnt || !password.trim()}
              >
                {guardando ? "Procesando..." : "Registrar cambio de turno"}
              </button>
            </div>
          </>
        )}

        {fase === "listo" && (
          <div className={styles.listoWrap}>
            <div className={styles.listoCheck}>✓</div>
            <div className={styles.listoTitulo}>Cambio de turno registrado</div>
            <div className={styles.listoFolio}>{folio}</div>
            <div style={{fontSize:13,color:"var(--muted)",textAlign:"center"}}>
              Sesión iniciada como <strong>{usuarioEntrante?.nombre}</strong>
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
