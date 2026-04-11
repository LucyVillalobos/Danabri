import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [carrito, setCarrito]   = useState({});
  const [historial, setHistorial] = useState([]);

const agregar = (producto) => {
  setCarrito((prev) => {
    const cantidadActual = prev[producto.id]?.cantidad || 0;
    if (cantidadActual >= producto.stock) return prev; // no pasar del stock
    return {
      ...prev,
      [producto.id]: {
        ...producto,
        cantidad: cantidadActual + 1,
      },
    };
  });
};

const cambiarCantidad = (id, delta) => {
  setCarrito((prev) => {
    const nueva = { ...prev };
    if (!nueva[id]) return nueva;
    const stock = nueva[id].stock || 0;
    const nuevaCantidad = nueva[id].cantidad + delta;
    if (nuevaCantidad > stock) return nueva; // no pasar del stock
    nueva[id] = { ...nueva[id], cantidad: nuevaCantidad };
    if (nueva[id].cantidad <= 0) delete nueva[id];
    return nueva;
  });
};

  const limpiar = () => setCarrito({});

  const registrarVenta = (venta) => {
    setHistorial((prev) => [venta, ...prev]);
  };

  const totalItems = Object.values(carrito).reduce((a, p) => a + p.cantidad, 0);
  const subtotal   = Object.values(carrito).reduce((a, p) => a + p.precio * p.cantidad, 0);
  const iva        = subtotal * 0.16;
  const total      = subtotal + iva;

  const ventasHoy    = historial.reduce((a, v) => a + v.total, 0);
  const productosVendidos = historial.reduce((a, v) => a + v.items.reduce((b, i) => b + i.cantidad, 0), 0);

  return (
    <CartContext.Provider value={{
      carrito, agregar, cambiarCantidad, limpiar,
      totalItems, subtotal, iva, total,
      historial, registrarVenta,
      ventasHoy, productosVendidos
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}