import { useState, useEffect } from "react";
import { getDescuentosActivos } from "../api/api";
import styles from "./ModalDescuentosActivos.module.css";

// Datos de ejemplo para cuando el backend aún no tiene el endpoint
const FALLBACK = [
  { id: 1, tipo: "marca",    nombre: "MAPED",     descuento_pct: 15, fecha_fin: "2026-05-31", aplica_en: "menudeo",        activo: true },
  { id: 2, tipo: "linea",    nombre: "Cuadernos", descuento_pct: 10, fecha_fin: "2026-06-15", aplica_en: "menudeo",        activo: true },
  { id: 3, tipo: "familia",  nombre: "Colores",   descuento_pct: 20, fecha_fin: "2026-05-20", aplica_en: "ambos",          activo: true },
  { id: 4, tipo: "producto", nombre: "Lápiz HB 12 pz", descuento_pct: 5, fecha_fin: null, aplica_en: "mayoreo", activo: true },
];

const TIPO_COLOR = {
  marca:    { bg: "#eff6ff", color: "#2563eb", label: "Marca" },
  linea:    { bg: "#f0fdf4", color: "#16a34a", label: "Línea" },
  familia:  { bg: "#faf5ff", color: "#7c3aed", label: "Familia" },
  producto: { bg: "#fff7ed", color: "#ea580c", label: "Producto" },
};

const APLICA_LABEL = {
  menudeo: "Solo menudeo",
  mayoreo: "Solo mayoreo",
  ambos:   "Menudeo y mayoreo",
};

function diasRestantes(fechaFin) {
  if (!fechaFin) return null;
  const hoy  = new Date();
  const fin  = new Date(fechaFin);
  const dias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
  return dias;
}

export default function ModalDescuentosActivos({ onCerrar }) {
  const [descuentos, setDescuentos] = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [filtro,     setFiltro]     = useState("todos"); // todos | marca | linea | familia | producto
  const [busqueda,   setBusqueda]   = useState("");

  useEffect(() => {
    getDescuentosActivos()
      .then(setDescuentos)
      .catch(() => setDescuentos(FALLBACK))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = descuentos.filter((d) => {
    const matchFiltro  = filtro === "todos" || d.tipo === filtro;
    const matchBusq    = d.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusq;
  });

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <span className={styles.titulo}>🏷️ Descuentos activos</span>
          <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
        </div>

        {/* Buscador */}
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Filtros por tipo */}
        <div className={styles.filtros}>
          {["todos", "marca", "linea", "familia", "producto"].map((f) => (
            <button
              key={f}
              className={`${styles.filtroBtn} ${filtro === f ? styles.filtroBtnActivo : ""}`}
              onClick={() => setFiltro(f)}
            >
              {f === "todos" ? "Todos" : TIPO_COLOR[f]?.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {cargando ? (
          <div className={styles.empty}>Cargando descuentos...</div>
        ) : filtrados.length === 0 ? (
          <div className={styles.empty}>
            <span>🏷️</span>
            <span>Sin descuentos activos</span>
          </div>
        ) : (
          <div className={styles.lista}>
            {filtrados.map((d) => {
              const tipo   = TIPO_COLOR[d.tipo] || TIPO_COLOR.producto;
              const dias   = diasRestantes(d.fecha_fin);
              const urgente = dias !== null && dias <= 3;
              const vencido = dias !== null && dias < 0;

              return (
                <div key={d.id} className={`${styles.card} ${vencido ? styles.cardVencido : ""}`}>
                  <div className={styles.cardLeft}>
                    <span
                      className={styles.tipoBadge}
                      style={{ background: tipo.bg, color: tipo.color }}
                    >
                      {tipo.label}
                    </span>
                    <div className={styles.cardNombre}>{d.nombre}</div>
                    <div className={styles.cardAplica}>{APLICA_LABEL[d.aplica_en] || d.aplica_en}</div>
                  </div>

                  <div className={styles.cardRight}>
                    <div className={styles.descPct}>-{d.descuento_pct}%</div>
                    {d.fecha_fin ? (
                      <div className={`${styles.cardFecha} ${urgente ? styles.cardFechaUrgente : ""} ${vencido ? styles.cardFechaVencida : ""}`}>
                        {vencido
                          ? "⚠ Vencido"
                          : urgente
                            ? `⚡ ${dias}d restantes`
                            : `Vence: ${new Date(d.fecha_fin).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`}
                      </div>
                    ) : (
                      <div className={styles.cardFecha}>Sin vencimiento</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.footerInfo}>
            {filtrados.length} descuento{filtrados.length !== 1 ? "s" : ""} activo{filtrados.length !== 1 ? "s" : ""}
          </span>
          <span className={styles.footerInfo}>Los descuentos se gestionan desde el módulo Administrativo</span>
        </div>

      </div>
    </div>
  );
}
