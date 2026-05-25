import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const COLORES_ESTADO = {
  PENDIENTE:  { bg: '#fff3e0', text: '#e65100' },
  CONFIRMADA: { bg: '#e3f2fd', text: '#1565c0' },
  PREPARANDO: { bg: '#f3e5f5', text: '#6a1b9a' },
  LISTA:      { bg: '#e8f5e9', text: '#2e7d32' },
  ENTREGADA:  { bg: '#f5f5f5', text: '#616161' },
  CANCELADA:  { bg: '#ffebee', text: '#c62828' },
};

export default function OrdenesScreen({ navigation }) {
  const { usuario } = useAuth();
  const [ordenes, setOrdenes]       = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // useFocusEffect: recarga SIEMPRE que la pantalla aparece en pantalla
  useFocusEffect(
    useCallback(() => {
      cargarOrdenes();
    }, [])
  );

  const cargarOrdenes = async () => {
    try {
      // endpoint específico por usuario
      const { data } = await api.get(`/ordenes/usuario/${usuario.id_usuario}`);
      setOrdenes(data);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar tus pedidos');
      console.error(e.response?.data || e.message);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  if (cargando) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#01696f" />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={ordenes}
        keyExtractor={o => o.id_orden.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); cargarOrdenes(); }}
            colors={['#01696f']}
          />
        }
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.vacioIcon}>📋</Text>
            <Text style={styles.vacioTexto}>No tienes pedidos aún</Text>
            <TouchableOpacity
              style={styles.btnMenu}
              onPress={() => navigation.navigate('Menu')}
            >
              <Text style={styles.btnMenuTexto}>Ir al Menú</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const estilo = COLORES_ESTADO[item.estado] || COLORES_ESTADO.PENDIENTE;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('QR', { orden: item })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.folio}>{item.folio_orden}</Text>
                <View style={[styles.estadoBadge, { backgroundColor: estilo.bg }]}>
                  <Text style={[styles.estadoTexto, { color: estilo.text }]}>
                    {item.estado}
                  </Text>
                </View>
              </View>
              <Text style={styles.fecha}>
                {new Date(item.creado_en).toLocaleDateString('es-MX', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.total}>
                  Total: ${parseFloat(item.total || 0).toFixed(2)}
                </Text>
                <Text style={styles.verQR}>Ver QR →</Text>
              </View>
              {item.estado === 'LISTA' && (
                <View style={styles.listoBanner}>
                  <Text style={styles.listoTexto}>¡Tu pedido está listo para recoger!</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f7f6f2' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vacio:       { alignItems: 'center', marginTop: 80, padding: 24 },
  vacioIcon:   { fontSize: 48, marginBottom: 12 },
  vacioTexto:  { fontSize: 16, color: '#7a7974', marginBottom: 20 },
  btnMenu:     { backgroundColor: '#01696f', paddingHorizontal: 24,
                 paddingVertical: 12, borderRadius: 8 },
  btnMenuTexto:{ color: '#fff', fontWeight: '600', fontSize: 15 },
  card:        { backgroundColor: '#fff', margin: 8, marginHorizontal: 12,
                 borderRadius: 12, padding: 14, elevation: 2 },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between',
                 alignItems: 'center', marginBottom: 6 },
  folio:       { fontSize: 15, fontWeight: '700', color: '#28251d' },
  estadoBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  estadoTexto: { fontSize: 12, fontWeight: '600' },
  fecha:       { fontSize: 13, color: '#7a7974', marginBottom: 8 },
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total:       { fontSize: 14, fontWeight: '600', color: '#01696f' },
  verQR:       { fontSize: 13, color: '#7a7974' },
  listoBanner: { backgroundColor: '#e8f5e9', borderRadius: 8,
                 padding: 8, marginTop: 10 },
  listoTexto:  { fontSize: 13, color: '#2e7d32', fontWeight: '600', textAlign: 'center' },
});
