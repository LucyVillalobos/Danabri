import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function calcularPrecio(producto, tipoCliente, cantidadTotal) {
  const esMayoreo =
    tipoCliente === "mayoreo" ||
    tipoCliente === "empresa" ||
    cantidadTotal >= (producto.min_mayoreo || 12);
  if (esMayoreo && producto.precio_mayoreo) return producto.precio_mayoreo;
  return producto.precio_menudeo ?? producto.precio ?? 0;
}

export function CartProvider({ children }) {
  const [carrito,       setCarrito]       = useState({});
  const [historial,     setHistorial]     = useState([]);
  const [vendedor,      setVendedor]      = useState(null);
  const [cliente,       setCliente]       = useState(null);
  const [esSuperusuario, setEsSuperusuario] = useState(false); // activar con PIN

  /* ── agregar ───────────────────────────────────────────────── */
  const agregar = (producto) => {
    setCarrito((prev) => {
      const cantidadActual = prev[producto.id]?.cantidad || 0;
      if (cantidadActual >= producto.stock) return prev;
      const nuevaCantidad = cantidadActual + 1;
      const tipoCliente   = cliente?.tipo_cliente || "menudeo";
      const precio        = calcularPrecio(producto, tipoCliente, nuevaCantidad);
      return {
        ...prev,
        [producto.id]: {
          ...producto,
          cantidad:        nuevaCantidad,
          precio_unitario: precio,
          descuento_pct:   prev[producto.id]?.descuento_pct ?? 0,
          precio_manual:   prev[producto.id]?.precio_manual ?? null,
        },
      };
    });
  };

  /* ── cambiar cantidad ──────────────────────────────────────── */
  const cambiarCantidad = (id, delta) => {
    setCarrito((prev) => {
      const nueva = { ...prev };
      if (!nueva[id]) return nueva;
      const stock         = nueva[id].stock || 0;
      const nuevaCantidad = nueva[id].cantidad + delta;
      if (nuevaCantidad > stock) return nueva;
      if (nuevaCantidad <= 0) { delete nueva[id]; return nueva; }
      const tipoCliente = cliente?.tipo_cliente || "menudeo";
      // si tiene precio manual, no recalcular
      const precio = nueva[id].precio_manual !== null
        ? nueva[id].precio_manual
        : calcularPrecio(nueva[id], tipoCliente, nuevaCantidad);
      nueva[id] = { ...nueva[id], cantidad: nuevaCantidad, precio_unitario: precio };
      return nueva;
    });
  };

  /* ── aplicar descuento % a un ítem (solo superusuario) ──────── */
  const aplicarDescuento = (id, pct) => {
    if (!esSuperusuario) return;
    setCarrito((prev) => {
      if (!prev[id]) return prev;
      const base  = prev[id].precio_menudeo ?? prev[id].precio ?? 0;
      const nuevo = parseFloat((base * (1 - pct / 100)).toFixed(2));
      return {
        ...prev,
        [id]: { ...prev[id], descuento_pct: pct, precio_unitario: nuevo, precio_manual: null },
      };
    });
  };

  /* ── cambiar precio manualmente (solo superusuario) ─────────── */
  const cambiarPrecioManual = (id, nuevoPrecio) => {
    if (!esSuperusuario) return;
    const precio = parseFloat(nuevoPrecio);
    if (isNaN(precio) || precio < 0) return;
    setCarrito((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], precio_unitario: precio, precio_manual: precio, descuento_pct: 0 },
      };
    });
  };

  /* ── quitar descuento / precio manual ───────────────────────── */
  const quitarDescuento = (id) => {
    setCarrito((prev) => {
      if (!prev[id]) return prev;
      const tipoCliente = cliente?.tipo_cliente || "menudeo";
      const precio      = calcularPrecio(prev[id], tipoCliente, prev[id].cantidad);
      return { ...prev, [id]: { ...prev[id], precio_unitario: precio, descuento_pct: 0, precio_manual: null } };
    });
  };


  /* ── agregar por código de barras (suma piezas del paquete) ── */
  const agregarPorCodigo = (producto) => {
    const piezas = producto.piezas_por_presentacion || 1;
    setCarrito((prev) => {
      const cantidadActual = prev[producto.id]?.cantidad || 0;
      const nuevaCantidad  = cantidadActual + piezas;
      if (nuevaCantidad > producto.stock) return prev;
      const tipoCliente = cliente?.tipo_cliente || "menudeo";
      const precio      = calcularPrecio(producto, tipoCliente, nuevaCantidad);
      return {
        ...prev,
        [producto.id]: {
          ...producto,
          cantidad:        nuevaCantidad,
          precio_unitario: precio,
          descuento_pct:   prev[producto.id]?.descuento_pct ?? 0,
          precio_manual:   prev[producto.id]?.precio_manual ?? null,
        },
      };
    });
  };

  /* ── seleccionar cliente (recalcula precios) ────────────────── */
  const seleccionarCliente = (nuevoCliente) => {
    setCliente(nuevoCliente);
    setCarrito((prev) => {
      const actualizado = {};
      for (const [id, item] of Object.entries(prev)) {
        // respetar precio manual si existe
        if (item.precio_manual !== null) { actualizado[id] = item; continue; }
        const tipoCliente = nuevoCliente?.tipo_cliente || "menudeo";
        const base        = calcularPrecio(item, tipoCliente, item.cantidad);
        const precio      = item.descuento_pct > 0
          ? parseFloat((base * (1 - item.descuento_pct / 100)).toFixed(2))
          : base;
        actualizado[id] = { ...item, precio_unitario: precio };
      }
      return actualizado;
    });
  };

  const limpiar        = () => setCarrito({});
  const registrarVenta = (venta) => setHistorial((prev) => [venta, ...prev]);

  /* ── totales ────────────────────────────────────────────────── */
  const items      = Object.values(carrito);
  const totalItems = items.reduce((a, p) => a + p.cantidad, 0);
  const subtotal   = items.reduce((a, p) => {
    const precio = p.precio_unitario ?? p.precio_menudeo ?? p.precio ?? 0;
    return a + precio * p.cantidad;
  }, 0);
  const ahorro = items.reduce((a, p) => {
    const base      = p.precio_menudeo ?? p.precio ?? 0;
    const cobrado   = p.precio_unitario ?? base;
    return a + (base - cobrado) * p.cantidad;
  }, 0);
  const iva   = subtotal * 0.16;
  const total = subtotal + iva;

  const ventasHoy         = historial.reduce((a, v) => a + v.total, 0);
  const productosVendidos = historial.reduce((a, v) => a + v.items.reduce((b, i) => b + i.cantidad, 0), 0);

  return (
    <CartContext.Provider value={{
      carrito, agregar, agregarPorCodigo, cambiarCantidad, limpiar,
      aplicarDescuento, cambiarPrecioManual, quitarDescuento,
      totalItems, subtotal, iva, total, ahorro,
      historial, registrarVenta,
      ventasHoy, productosVendidos,
      vendedor, setVendedor,
      cliente,  seleccionarCliente,
      esSuperusuario, setEsSuperusuario,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }
