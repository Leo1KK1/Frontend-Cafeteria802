import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function PerfilPersonalScreen() {
  const { usuario, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetra}>
            {usuario?.nombre_completo?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.nombre}>{usuario?.nombre_completo}</Text>
        <Text style={styles.correo}>{usuario?.correo}</Text>
        <View style={styles.rolBadge}>
          <Text style={styles.rolTexto}>PERSONAL DE CAFETERÍA</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.btnCerrar}
        onPress={() => Alert.alert('Cerrar Sesión', '¿Salir?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: logout }
        ])}
      >
        <Ionicons name="log-out-outline" size={22} color="#c62828" />
        <Text style={styles.btnCerrarTexto}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f7f6f2' },
  header:       { backgroundColor: '#01696f', alignItems: 'center',
                  paddingTop: 60, paddingBottom: 30 },
  avatar:       { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff',
                  justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarLetra:  { fontSize: 36, fontWeight: 'bold', color: '#01696f' },
  nombre:       { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  correo:       { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  rolBadge:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
                  paddingHorizontal: 14, paddingVertical: 4 },
  rolTexto:     { color: '#fff', fontSize: 12, fontWeight: '600' },
  btnCerrar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 10, margin: 24, padding: 16, backgroundColor: '#fff',
                  borderRadius: 12, elevation: 1 },
  btnCerrarTexto:{ fontSize: 16, fontWeight: '600', color: '#c62828' },
});
