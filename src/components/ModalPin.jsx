import { useState } from "react";
import styles from "./ModalPin.module.css";

// PIN hardcodeado por ahora; cuando haya gestión de usuarios vendrá del backend
const PIN_SUPERUSUARIO = "1234";

function ModalPin({ onExito, onCerrar }) {
  const [pin,    setPin]    = useState("");
  const [error,  setError]  = useState(false);
  const [shake,  setShake]  = useState(false);

  const intentar = () => {
    if (pin === PIN_SUPERUSUARIO) {
      onExito();
      onCerrar();
    } else {
      setError(true);
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 500);
    }
  };

  const presionar = (val) => {
    setError(false);
    if (val === "←") { setPin((p) => p.slice(0, -1)); return; }
    if (val === "✓") { intentar(); return; }
    if (pin.length < 6) setPin((p) => p + val);
  };

  const teclas = ["1","2","3","4","5","6","7","8","9","←","0","✓"];

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={`${styles.modal} ${shake ? styles.shake : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.titulo}>🔐 Acceso superusuario</div>
        <div className={styles.sub}>Ingresa tu PIN para aplicar descuentos o cambiar precios</div>

        <div className={styles.puntos}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`${styles.punto} ${i < pin.length ? styles.puntoActivo : ""}`} />
          ))}
        </div>

        {error && <div className={styles.errorMsg}>PIN incorrecto</div>}

        <div className={styles.teclado}>
          {teclas.map((t) => (
            <button
              key={t}
              className={`${styles.tecla} ${t === "✓" ? styles.teclaOk : ""} ${t === "←" ? styles.teclaBorrar : ""}`}
              onClick={() => presionar(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <button className={styles.cancelar} onClick={onCerrar}>Cancelar</button>
      </div>
    </div>
  );
}

export default ModalPin;
