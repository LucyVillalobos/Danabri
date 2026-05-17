import { RUTAS } from "../rutas";
import styles from "./NavBar.module.css";

const MENU = [
  { ruta: RUTAS.POS,           label: "POS",           emoji: "🛒" },
  { ruta: RUTAS.CLIENTES,      label: "Clientes",      emoji: "👥" },
  { ruta: RUTAS.REMISIONES,    label: "Remisiones",    emoji: "📄" },
  { ruta: RUTAS.COTIZACIONES,  label: "Cotizaciones",  emoji: "📋" },
  { ruta: RUTAS.COT_EMPRESA,   label: "Cot. Empresa",  emoji: "🏢" },
  { ruta: RUTAS.PERFILES_CAJA, label: "Cajas",         emoji: "🏧" },
  { ruta: RUTAS.ETIQUETAS,     label: "Etiquetas",     emoji: "🏷️" },
  { ruta: RUTAS.RUTAS,         label: "Rutas",          emoji: "🗺️" },
];

export default function NavBar({ ruta, navegar }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.menu}>
        {MENU.map((item) => (
          <button
            key={item.ruta}
            className={`${styles.item} ${ruta === item.ruta ? styles.itemActivo : ""}`}
            onClick={() => navegar(item.ruta)}
          >
            <span className={styles.emoji}>{item.emoji}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
