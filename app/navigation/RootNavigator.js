import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

import AuthNavigator       from './AuthNavigator';
import EstudianteNavigator from './EstudianteNavigator';
import PersonalNavigator   from './PersonalNavigator';
import AdminNavigator      from './AdminNavigator';

export default function RootNavigator() {
  const { usuario, cargando } = useAuth();

  console.log('RootNavigator - usuario:', usuario?.correo, '| rol:', usuario?.roles?.nombre);


  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#01696f" />
      </View>
    );
  }

  // ✅ Obtener el rol usando roles?.nombre O id_rol como respaldo
  const getRolNav = () => {
    if (!usuario) return <AuthNavigator />;

    const rolNombre = usuario.roles?.nombre || getRolPorId(usuario.id_rol);

    switch (rolNombre) {
      case 'ADMIN':    return <AdminNavigator />;
      case 'PERSONAL': return <PersonalNavigator />;
      default:         return <EstudianteNavigator />;
    }
  };

  return (
    <NavigationContainer>
      {getRolNav()}
    </NavigationContainer>
  );
}

function getRolPorId(id_rol) {
  const roles = { 1: 'ADMIN', 2: 'PERSONAL', 3: 'ESTUDIANTE' };
  return roles[id_rol] || 'ESTUDIANTE';
}
