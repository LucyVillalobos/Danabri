import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // usuario: { id_usuario, nombre, email, rol }

  const entrar  = (u) => setUsuario(u);
  const salir   = () => setUsuario(null);

  return (
    <AuthContext.Provider value={{ usuario, entrar, salir }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
