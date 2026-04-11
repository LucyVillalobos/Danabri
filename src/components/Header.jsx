import { useState, useEffect, useCallback } from "react";
import logo from "../assets/DanabriLogoRecortado.png";
import { useCart } from "./CartContext";
import { getResumenDia } from "../api/api";
import styles from "./Header.module.css";

export function useTheme() {
  const [dark, setDark] = useState(false);
  const toggle = () => {
    setDark((d) => {
      document.documentElement.setAttribute("data-theme", !d ? "dark" : "light");
      return !d;
    });
  };
  return { dark, toggle };
}

function Header({ onVerHistorial }) {
  const [hora, setHora] = useState("");
  const [resumen, setResumen] = useState({ ventas_hoy: 0, productos_vendidos: 0 });
  const { historial } = useCart() ?? {};

  const cargarResumen = useCallback(() => {
    getResumenDia()
      .then((data) => setResumen(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    cargarResumen();
  }, [historial, cargarResumen]); // se recarga cada vez que hay una venta nueva

  useEffect(() => {
    const actualizar = () => {
      setHora(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }));
    };
    actualizar();
    const intervalo = setInterval(actualizar, 1000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.logoWrap}>
        <img src={logo} alt="Papelera Danabri" className={styles.logo} />
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
      </div>

      <div className={styles.right}>
        <div className={styles.badge}>{hora}</div>
        <div className={styles.badge}>Lucy</div>
      </div>
    </header>
  );
}

export default Header;