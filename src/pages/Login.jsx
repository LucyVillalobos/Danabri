import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { login, getUsuarios } from "../api/api";
import logo from "../assets/DanabriLogoRecortado.png";
import styles from "./Login.module.css";

export default function Login() {
  const { entrar } = useAuth();
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [cargando,  setCargando]  = useState(false);
  const [error,     setError]     = useState("");
  const [showPass,  setShowPass]  = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu correo y contraseña"); return;
    }
    setCargando(true);
    setError("");
    try {
      const usuario = await login({ email: email.trim(), password });
      entrar(usuario);
    } catch (err) {
      // Fallback local para desarrollo — cuando el backend aún no tiene /auth/login
      // En producción eliminar este bloque y dejar solo el catch del error
      try {
        const usuarios = await getUsuarios();
        const encontrado = usuarios.find(
          u => (u.email || "").toLowerCase() === email.trim().toLowerCase()
        );
        if (encontrado) {
          entrar({ ...encontrado, rol: encontrado.roles || "vendedor" });
        } else {
          setError("Usuario no encontrado");
        }
      } catch {
        setError(err.message || "Error al conectar con el servidor");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <img src={logo} alt="Danabri" className={styles.logo} />
        </div>

        <div className={styles.titulo}>Iniciar sesión</div>
        <div className={styles.sub}>Punto de Venta · Papelería Danabri</div>

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.campo}>
            <label className={styles.label}>Correo electrónico</label>
            <input
              className={styles.input}
              type="email"
              placeholder="correo@danabri.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label}>Contraseña</label>
            <div className={styles.passWrap}>
              <input
                className={styles.input}
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={styles.btnLogin}
            type="submit"
            disabled={cargando}
          >
            {cargando ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <div className={styles.footer}>
          ¿Problemas para acceder? Contacta al administrador del sistema.
        </div>
      </div>
    </div>
  );
}
