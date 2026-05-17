import { useState, useEffect, useCallback } from "react";
import logo from "../assets/DanabriLogoRecortado.png";
import { useCart } from "./CartContext";
import { useAuth } from "../context/AuthContext";
import { getResumenDia } from "../api/api";
import styles from "./Header.module.css";

function Header({ onVerHistorial, onAbrirF2 }) {
  const [hora,    setHora]    = useState("");
  const [resumen, setResumen] = useState({ ventas_hoy: 0, productos_vendidos: 0, monto_caja: 0 });
  const { historial } = useCart() ?? {};
  const { usuario, salir } = useAuth();

  const cargarResumen = useCallback(() => {
    getResumenDia().then(setResumen).catch(() => {});
  }, []);

  useEffect(() => { cargarResumen(); }, [historial, cargarResumen]);

  useEffect(() => {
    const tick = () =>
      setHora(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSalir = () => {
    if (window.confirm("¿Cerrar sesión?")) salir();
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoWrap}>
        <img src={logo} alt="Papelería Danabri" className={styles.logo} />
      </div>

      <div className={styles.center}>
        <button className={styles.statBtn} onClick={onVerHistorial}>
          <span className={styles.statLabel}>Ventas hoy</span>
          <span className={styles.statVal}>${Number(resumen.ventas_hoy || 0).toFixed(2)}</span>
        </button>
        <div className={styles.statDivider} />
        <button className={styles.statBtn} onClick={onVerHistorial}>
          <span className={styles.statLabel}>Productos vendidos</span>
          <span className={styles.statVal}>{resumen.productos_vendidos || 0}</span>
        </button>
        <div className={styles.statDivider} />
        <div className={styles.statBtn}>
          <span className={styles.statLabel}>💰 En caja</span>
          <span className={`${styles.statVal} ${styles.statCaja}`}>
            ${Number(resumen.monto_caja || 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.badge}>{hora}</div>

        {/* Usuario activo */}
        {usuario && (
          <div className={styles.usuarioBadge}>
            <div className={styles.usuarioAvatar}>{usuario.nombre?.charAt(0)}</div>
            <div className={styles.usuarioInfo}>
              <span className={styles.usuarioNombre}>{usuario.nombre}</span>
              <span className={styles.usuarioRol}>{usuario.rol || "cajero"}</span>
            </div>
          </div>
        )}

        <button className={styles.f2Btn} onClick={onAbrirF2} title="Menú de opciones (F2)">
          F2
        </button>

        <button className={styles.salirBtn} onClick={handleSalir} title="Cerrar sesión">
          🚪
        </button>
      </div>
    </header>
  );
}

export default Header;
