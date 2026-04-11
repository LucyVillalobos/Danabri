import styles from "./Buscador.module.css";

function Buscador({ busqueda, setBusqueda, categorias, categoria, setCategoria }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBar}>
        <span className={styles.icon}>⌕</span>
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      <div className={styles.cats}>
        {categorias.map((c) => (
          <button
            key={c}
            className={`${styles.cat} ${c === categoria ? styles.active : ""}`}
            onClick={() => setCategoria(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Buscador;