import { useState, useEffect } from "react";
import Header from "../components/Header";
import Buscador from "../components/Buscador";
import ListaProductos from "../components/ListaProductos";
import Carrito from "../components/Carrito";
import HistorialVentas from "../components/HistorialVentas";
import { getProductos } from "../api/api";
import styles from "./POS.module.css";

function POS() {
  const [productos,        setProductos]        = useState([]);
  const [cargando,         setCargando]         = useState(true);
  const [error,            setError]            = useState(null);
  const [busqueda,         setBusqueda]         = useState("");
  const [categoria,        setCategoria]        = useState("Todos");
  const [historialAbierto, setHistorialAbierto] = useState(false);

  useEffect(() => {
    getProductos()
      .then((data) => {
        setProductos(data);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  // Aplanar productos con sus presentaciones para el POS
  const productosAplanados = productos.flatMap((p) =>
    p.presentaciones.map((pp) => ({
      id:             pp.id_presentacion,
      id_presentacion: pp.id_presentacion,
      nombre:         `${p.nombre}${p.presentaciones.length > 1 ? ` — ${pp.nombre}` : ""}`,
      precio_menudeo: pp.precio_menudeo,
      precio_mayoreo: pp.precio_mayoreo,
      precio:         pp.precio_menudeo,
      stock:          pp.stock,
      categoria:      p.categoria || "General",
      emoji:          getEmoji(p.categoria),
    }))
  );

  const categorias = ["Todos", ...new Set(productosAplanados.map((p) => p.categoria))];

  const productosFiltrados = productosAplanados.filter((p) => {
    const matchCat      = categoria === "Todos" || p.categoria === categoria;
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusqueda;
  });

  return (
    <div className={styles.posContainer}>
      <div className={styles.posLeft}>
        <Header onVerHistorial={() => setHistorialAbierto(true)} />
        <Buscador
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          categorias={categorias}
          categoria={categoria}
          setCategoria={setCategoria}
        />

        {cargando && (
          <div className={styles.estado}>
            <span className={styles.spinner} />
            Cargando productos...
          </div>
        )}

        {error && (
          <div className={styles.estadoError}>
            ⚠️ {error} — ¿Está corriendo el backend?
          </div>
        )}

        {!cargando && !error && (
          <ListaProductos productos={productosFiltrados} />
        )}
      </div>

      <Carrito />

      {historialAbierto && (
        <HistorialVentas onCerrar={() => setHistorialAbierto(false)} />
      )}
    </div>
  );
}

// Emoji por categoría
function getEmoji(categoria) {
  const map = {
    "Cuadernos":    "📓",
    "Escritura":    "✏️",
    "Accesorios":   "✂️",
    "Organización": "📁",
    "General":      "📦",
  };
  return map[categoria] || "📦";
}

export default POS;