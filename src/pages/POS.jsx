import { useState, useEffect } from "react";
import Header         from "../components/Header";
import BuscadorCodigo from "../components/BuscadorCodigo";
import Buscador       from "../components/Buscador";
import ListaProductos from "../components/ListaProductos";
import Carrito        from "../components/Carrito";
import HistorialVentas from "../components/HistorialVentas";
import MenuF2         from "../components/MenuF2";
import { getProductos } from "../api/api";
import styles from "./POS.module.css";

function POS() {
  const [productos,        setProductos]        = useState([]);
  const [cargando,         setCargando]         = useState(true);
  const [error,            setError]            = useState(null);
  const [busqueda,         setBusqueda]         = useState("");
  const [categoria,        setCategoria]        = useState("Todos");
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [menuF2Abierto,    setMenuF2Abierto]    = useState(false);
  const [reload,           setReload]           = useState(0);

  // Atajo de teclado F2
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F2") { e.preventDefault(); setMenuF2Abierto((v) => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setCargando(true);
    getProductos()
      .then((data) => { setProductos(data); setCargando(false); })
      .catch((err)  => { setError(err.message); setCargando(false); });
  }, [reload]);

  const productosAplanados = productos.flatMap((p) =>
    p.presentaciones.map((pp) => ({
      id:              pp.id_presentacion,
      id_presentacion: pp.id_presentacion,
      nombre:          `${p.nombre}${p.presentaciones.length > 1 ? ` — ${pp.nombre}` : ""}`,
      precio_menudeo:  pp.precio_menudeo,
      precio_mayoreo:  pp.precio_mayoreo,
      precio:          pp.precio_menudeo,
      stock:           pp.stock,
      categoria:       p.categoria || "General",
      emoji:           getEmoji(p.categoria),
    }))
  );

  const categorias = ["Todos", ...new Set(productosAplanados.map((p) => p.categoria))];

  const productosFiltrados = productosAplanados.filter((p) => {
    const matchCat      = categoria === "Todos" || p.categoria === categoria;
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusqueda;
  });

  const recargar = () => setReload((r) => r + 1);

  return (
    <div className={styles.posContainer}>
      <div className={styles.posLeft}>
        <Header
          onVerHistorial={() => setHistorialAbierto(true)}
          onAbrirF2={() => setMenuF2Abierto(true)}
        />
        <BuscadorCodigo />
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

      <Carrito onVentaCompletada={recargar} />

      {historialAbierto && (
        <HistorialVentas onCerrar={() => setHistorialAbierto(false)} />
      )}

      {menuF2Abierto && (
        <MenuF2
          onCerrar={() => setMenuF2Abierto(false)}
          onRecargar={recargar}
        />
      )}
    </div>
  );
}

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
