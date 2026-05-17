import { useState } from "react";
import { CartProvider } from "./components/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login           from "./pages/Login";
import POS             from "./pages/POS";
import Clientes        from "./pages/Clientes";
import Remisiones      from "./pages/Remisiones";
import Cotizaciones    from "./pages/Cotizaciones";
import CotizacionEmpresa from "./pages/CotizacionEmpresa";
import PerfilesCaja    from "./pages/PerfilesCaja";
import Etiquetas       from "./pages/Etiquetas";
import Rutas           from "./pages/Rutas";
import NavBar          from "./components/NavBar";
import "./App.css";
import { RUTAS } from "./rutas";

function AppInterna() {
  const { usuario } = useAuth();
  const [ruta,   setRuta]   = useState(RUTAS.POS);
  const [params, setParams] = useState({});

  const navegar = (r, p = {}) => { setRuta(r); setParams(p); };

  // Si no hay sesión → mostrar login
  if (!usuario) return <Login />;

  return (
    <CartProvider>
      <NavBar ruta={ruta} navegar={navegar} />
      {ruta === RUTAS.POS           && <POS navegar={navegar} />}
      {ruta === RUTAS.CLIENTES      && <Clientes navegar={navegar} params={params} />}
      {ruta === RUTAS.REMISIONES    && <Remisiones navegar={navegar} params={params} />}
      {ruta === RUTAS.COTIZACIONES  && <Cotizaciones navegar={navegar} params={params} />}
      {ruta === RUTAS.COT_EMPRESA   && <CotizacionEmpresa navegar={navegar} params={params} />}
      {ruta === RUTAS.PERFILES_CAJA && <PerfilesCaja navegar={navegar} />}
      {ruta === RUTAS.ETIQUETAS     && <Etiquetas navegar={navegar} />}
      {ruta === RUTAS.RUTAS         && <Rutas navegar={navegar} />}
    </CartProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInterna />
    </AuthProvider>
  );
}

export default App;
