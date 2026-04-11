import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState({});

  const agregar = (producto) => {
    setCarrito((prev) => ({
      ...prev,
      [producto.id]: {
        ...producto,
        cantidad: (prev[producto.id]?.cantidad || 0) + 1,
      },
    }));
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito((prev) => {
      const nueva = { ...prev };
      if (!nueva[id]) return nueva;
      nueva[id] = { ...nueva[id], cantidad: nueva[id].cantidad + delta };
      if (nueva[id].cantidad <= 0) delete nueva[id];
      return nueva;
    });
  };

  const limpiar = () => setCarrito({});

  const totalItems = Object.values(carrito).reduce((a, p) => a + p.cantidad, 0);
  const subtotal = Object.values(carrito).reduce((a, p) => a + p.precio * p.cantidad, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <CartContext.Provider value={{ carrito, agregar, cambiarCantidad, limpiar, totalItems, subtotal, iva, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}