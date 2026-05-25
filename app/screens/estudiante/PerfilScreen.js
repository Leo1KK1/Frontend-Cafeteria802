import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function PerfilScreen({ navigation }) {
  const { usuario, logout } = useAuth();

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: logout }
      ]
    );
  };

  const OpcionMenu = ({ icono, texto, color = '#28251d', onPress, descripcion }) => (
    <TouchableOpacity style={styles.opcion} onPress={onPress}>
      <View style={[styles.opcionIcono, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icono} size={22} color={color} />
      </View>
      <View style={styles.opcionInfo}>
        <Text style={[styles.opcionTexto, { color }]}>{texto}</Text>
        {descripcion && <Text style={styles.opcionDesc}>{descripcion}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>

      {/* Header del perfil */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetra}>
            {usuario?.nombre_completo?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.nombre}>{usuario?.nombre_completo}</Text>
        <Text style={styles.correo}>{usuario?.correo}</Text>
        <View style={styles.rolBadge}>
          <Text style={styles.rolTexto}>
            {usuario?.roles?.nombre || 'ESTUDIANTE'}
          </Text>
        </View>
      </View>

      {/* Sección Mi Cuenta */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>MI CUENTA</Text>

        <OpcionMenu
          icono="person-outline"
          texto="Información Personal"
          descripcion={usuario?.telefono || 'Sin teléfono registrado'}
          onPress={() => Alert.alert('Próximamente', 'Editar perfil estará disponible pronto')}
        />
        <OpcionMenu
          icono="receipt-outline"
          texto="Historial de Pedidos"
          descripcion="Ver todos tus pedidos anteriores"
          onPress={() => navigation.navigate('MisPedidos')}
        />
        <OpcionMenu
          icono="lock-closed-outline"
          texto="Cambiar Contraseña"
          descripcion="Actualizar tu contraseña de acceso"
          onPress={() => Alert.alert('Próximamente', 'Cambio de contraseña disponible pronto')}
        />
      </View>

      {/* Sección App */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>APLICACIÓN</Text>

        <OpcionMenu
          icono="notifications-outline"
          texto="Notificaciones"
          descripcion="Gestionar alertas de pedidos"
          onPress={() => Alert.alert('Próximamente', 'Configuración de notificaciones')}
        />
        <OpcionMenu
          icono="help-circle-outline"
          texto="Ayuda y Soporte"
          descripcion="¿Tienes algún problema?"
          onPress={() => Alert.alert('Soporte', 'Contacta a la cafetería directamente')}
        />
        <OpcionMenu
          icono="information-circle-outline"
          texto="Acerca de"
          descripcion="Venado FOOD v1.0.0"
          onPress={() => Alert.alert('Venado Food', 'Sistema de pedidos v1.0.0\nDesarrollado por Leo González II-802')}
        />
      </View>

      {/* Botón Cerrar Sesión */}
      <View style={styles.seccion}>
        <TouchableOpacity style={styles.btnCerrarSesion} onPress={cerrarSesion}>
          <Ionicons name="log-out-outline" size={22} color="#c62828" />
          <Text style={styles.btnCerrarSesionTexto}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Cafetería 802 © 2026</Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#f7f6f2' },

  // Header
  header:              { backgroundColor: '#01696f', alignItems: 'center',
                         paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
  avatar:              { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff',
                         justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarLetra:         { fontSize: 36, fontWeight: 'bold', color: '#01696f' },
  nombre:              { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  correo:              { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  rolBadge:            { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
                         paddingHorizontal: 14, paddingVertical: 4 },
  rolTexto:            { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Secciones
  seccion:             { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 16,
                         borderRadius: 12, overflow: 'hidden' },
  seccionTitulo:       { fontSize: 11, fontWeight: '700', color: '#7a7974',
                         paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
                         letterSpacing: 1 },

  // Opciones
  opcion:              { flexDirection: 'row', alignItems: 'center',
                         paddingHorizontal: 16, paddingVertical: 13,
                         borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  opcionIcono:         { width: 38, height: 38, borderRadius: 10,
                         justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  opcionInfo:          { flex: 1 },
  opcionTexto:         { fontSize: 15, fontWeight: '500' },
  opcionDesc:          { fontSize: 12, color: '#7a7974', marginTop: 1 },

  // Cerrar sesión
  btnCerrarSesion:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                         gap: 10, padding: 16 },
  btnCerrarSesionTexto:{ fontSize: 16, fontWeight: '600', color: '#c62828' },

  version:             { textAlign: 'center', color: '#bab9b4', fontSize: 12,
                         marginTop: 16, marginBottom: 32 },
});
