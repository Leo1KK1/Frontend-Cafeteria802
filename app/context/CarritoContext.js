import React, { createContext, useContext, useState } from 'react';

const CarritoContext = createContext();

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([]);

  const agregarItem = (producto) => {
    setItems(prev => {
      const existe = prev.find(i => i.id_producto === producto.id_producto);
      if (existe) {
        return prev.map(i =>
          i.id_producto === producto.id_producto
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const quitarItem = (id_producto) => {
    setItems(prev => {
      const existe = prev.find(i => i.id_producto === id_producto);
      if (existe?.cantidad === 1) return prev.filter(i => i.id_producto !== id_producto);
      return prev.map(i =>
        i.id_producto === id_producto ? { ...i, cantidad: i.cantidad - 1 } : i
      );
    });
  };

  const limpiarCarrito = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0);

  return (
    <CarritoContext.Provider value={{ items, agregarItem, quitarItem, limpiarCarrito, total, totalItems }}>
      {children}
    </CarritoContext.Provider>
  );
}

export const useCarrito = () => useContext(CarritoContext);
