import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

// Mapeo directo id_rol → nombre 
const ROL_MAP = { 1: 'ADMIN', 2: 'PERSONAL', 3: 'ESTUDIANTE' };

function normalizarUsuario(u) {
  if (!u) return null;
  return {
    ...u,
    // Asegurar que roles.nombre siempre exista
    roles: {
      nombre: u.roles?.nombre || ROL_MAP[u.id_rol] || 'ESTUDIANTE'
    }
  };
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken]     = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const t = await AsyncStorage.getItem('token');
        const u = await AsyncStorage.getItem('usuario');
        if (t && u) {
          setToken(t);
          setUsuario(normalizarUsuario(JSON.parse(u)));
        }
      } catch (e) {
        console.log('Error cargando sesión:', e);
      } finally {
        setCargando(false);
      }
    };
    cargarSesion();
  }, []);

  const login = async (correo, contrasena) => {
    const { data } = await api.post('/auth/login', { correo, contrasena });
    const usuarioNormalizado = normalizarUsuario(data.usuario);

    try {
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('usuario', JSON.stringify(usuarioNormalizado));
    } catch (e) {
      console.log('AsyncStorage no disponible:', e);
    }

    setToken(data.token);
    setUsuario(usuarioNormalizado);
    return usuarioNormalizado;
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'usuario']);
    } catch (e) {
      console.log('Error en logout AsyncStorage:', e);
    }
    //re-render en RootNavigator
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
