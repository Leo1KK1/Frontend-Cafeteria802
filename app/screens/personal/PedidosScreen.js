import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal,
  ScrollView, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { horaCDMX, fechaHoraCDMX } from '../../utils/fecha';

const ESTADOS = ['PENDIENTE', 'CONFIRMADA', 'PREPARANDO', 'LISTA'];

const COLORES = {
  PENDIENTE:  { bg: '#fff3e0', text: '#e65100' },
  CONFIRMADA: { bg: '#e3f2fd', text: '#1565c0' },
  PREPARANDO: { bg: '#f3e5f5', text: '#6a1b9a' },
  LISTA:      { bg: '#e8f5e9', text: '#2e7d32' },
  ENTREGADA:  { bg: '#f5f5f5', text: '#616161' },
  CANCELADA:  { bg: '#ffebee', text: '#c62828' },
};

const SIGUIENTE_ESTADO = {
  PENDIENTE:  'CONFIRMADA',
  CONFIRMADA: 'PREPARANDO',
  PREPARANDO: 'LISTA',
};

// ─── Fila de detalle del pedido ────────────────────────────────
const FilaDetalle = ({ item }) => (
  <View style={styles.filaDetalle}>
    {item.productos?.imagen_url ? (
      <Image
        source={{ uri: item.productos.imagen_url }}
        style={styles.detalleImagen}
        resizeMode="cover"
      />
    ) : (
      <View style={styles.detalleImagenVacia}>
        <Ionicons name="fast-food-outline" size={20} color="#ccc" />
      </View>
    )}
    <View style={styles.detalleInfo}>
      <Text style={styles.detalleNombre}>
        {item.productos?.nombre || 'Producto'}
      </Text>
      {item.notas ? (
        <Text style={styles.detalleNotas}>📝 {item.notas}</Text>
      ) : null}
    </View>
    <View style={styles.detalleRight}>
      <Text style={styles.detalleCantidad}>×{item.cantidad}</Text>
      <Text style={styles.detallePrecio}>
        ${parseFloat(item.subtotal || 0).toFixed(2)}
      </Text>
    </View>
  </View>
);

// ─── Componente principal ──────────────────────────────────────
export default function PedidosScreen() {
  const [ordenes,        setOrdenes]        = useState([]);
  const [cargando,       setCargando]       = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [filtro,         setFiltro]         = useState('PENDIENTE');
  const [ordenDetalle,   setOrdenDetalle]   = useState(null);
  const [detalles,       setDetalles]       = useState([]);
  const [cargandoDetalle,setCargandoDetalle]= useState(false);
  const [modalVisible,   setModalVisible]   = useState(false);

  useFocusEffect(useCallback(() => { cargarOrdenes(); }, []));

  const cargarOrdenes = async () => {
    try {
      const { data } = await api.get('/ordenes');
      setOrdenes(data);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  // ── Ver detalle ────────────────────────────────────────────
  const verDetalle = async (orden) => {
    setOrdenDetalle(orden);
    setDetalles([]);
    setModalVisible(true);
    setCargandoDetalle(true);
    try {
      const { data } = await api.get(`/ordenes/${orden.id_orden}/detalles`);
      setDetalles(data);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el detalle');
    } finally {
      setCargandoDetalle(false);
    }
  };

  // ── Avanzar estado ─────────────────────────────────────────
  const avanzarEstado = async (orden) => {
    const siguiente = SIGUIENTE_ESTADO[orden.estado];
    if (!siguiente) return;

    Alert.alert(
      'Cambiar Estado',
      `¿Marcar "${orden.folio_orden}" como ${siguiente}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.patch(`/ordenes/${orden.id_orden}/estado`,
                { estado: siguiente });
              // Si el modal está abierto, actualizar orden en detalle
              if (ordenDetalle?.id_orden === orden.id_orden) {
                setOrdenDetalle(prev => ({ ...prev, estado: siguiente }));
              }
              cargarOrdenes();
            } catch (e) {
              Alert.alert('Error', 'No se pudo actualizar el estado');
            }
          }
        }
      ]
    );
  };

  const ordenesFiltradas = ordenes.filter(o => o.estado === filtro);

  if (cargando) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#01696f" />
    </View>
  );

  return (
    <View style={styles.container}>

      {/* ── Filtros ─────────────────────────────────────────── */}
      <View style={styles.filtros}>
        {ESTADOS.map(estado => {
          const count = ordenes.filter(o => o.estado === estado).length;
          return (
            <TouchableOpacity
              key={estado}
              style={[styles.filtroBtn,
                filtro === estado && styles.filtroBtnActivo]}
              onPress={() => setFiltro(estado)}
            >
              <Text style={[styles.filtroTexto,
                filtro === estado && styles.filtroTextoActivo]}>
                {estado}
              </Text>
              {count > 0 && (
                <View style={styles.filtroBadge}>
                  <Text style={styles.filtroBadgeTexto}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Lista de pedidos ─────────────────────────────────── */}
      <FlatList
        data={ordenesFiltradas}
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
            <Ionicons name="checkmark-circle-outline" size={56} color="#ccc" />
            <Text style={styles.vacioTexto}>
              No hay pedidos {filtro.toLowerCase()}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const estilo    = COLORES[item.estado] || COLORES.PENDIENTE;
          const siguiente = SIGUIENTE_ESTADO[item.estado];
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => verDetalle(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.folio}>{item.folio_orden}</Text>
                <View style={[styles.badge, { backgroundColor: estilo.bg }]}>
                  <Text style={[styles.badgeTexto, { color: estilo.text }]}>
                    {item.estado}
                  </Text>
                </View>
              </View>

              <Text style={styles.cliente}>
                👤 {item.usuarios?.nombre_completo || 'Usuario'}
              </Text>
              {/* ✅ Hora en timezone CDMX */}
              <Text style={styles.hora}>
                🕐 {horaCDMX(item.creado_en)}
              </Text>
              <Text style={styles.total}>
                💰 Total: ${parseFloat(item.total || 0).toFixed(2)}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.verDetalle}>
                  <Ionicons name="eye-outline" size={13} color="#01696f" /> Ver detalle
                </Text>
                {siguiente && (
                  <TouchableOpacity
                    style={styles.btnAvanzar}
                    onPress={() => avanzarEstado(item)}
                  >
                    <Ionicons name="arrow-forward-circle-outline"
                      size={16} color="#fff" />
                    <Text style={styles.btnAvanzarTexto}>
                      {siguiente}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Modal Detalle del Pedido ─────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>

          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>Detalle del Pedido</Text>
            <View style={{ width: 26 }} />
          </View>

          {ordenDetalle && (
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

              {/* Info general */}
              <View style={styles.seccion}>
                <View style={styles.seccionRow}>
                  <Text style={styles.seccionLabel}>Folio</Text>
                  <Text style={styles.seccionValorBold}>
                    {ordenDetalle.folio_orden}
                  </Text>
                </View>
                <View style={styles.seccionRow}>
                  <Text style={styles.seccionLabel}>Cliente</Text>
                  <Text style={styles.seccionValor}>
                    {ordenDetalle.usuarios?.nombre_completo || 'N/A'}
                  </Text>
                </View>
                <View style={styles.seccionRow}>
                  <Text style={styles.seccionLabel}>Hora del pedido</Text>
                  {/* ✅ Fecha y hora completa en CDMX */}
                  <Text style={styles.seccionValor}>
                    {fechaHoraCDMX(ordenDetalle.creado_en)}
                  </Text>
                </View>
                <View style={styles.seccionRow}>
                  <Text style={styles.seccionLabel}>Estado</Text>
                  <View style={[styles.badge,
                    { backgroundColor: COLORES[ordenDetalle.estado]?.bg || '#eee' }]}>
                    <Text style={[styles.badgeTexto,
                      { color: COLORES[ordenDetalle.estado]?.text || '#333' }]}>
                      {ordenDetalle.estado}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Productos del pedido */}
              <Text style={styles.seccionTitulo}>🛒 Productos</Text>
              <View style={styles.seccion}>
                {cargandoDetalle ? (
                  <ActivityIndicator color="#01696f" style={{ padding: 20 }} />
                ) : detalles.length === 0 ? (
                  <Text style={styles.sinDetalles}>
                    Sin detalles disponibles
                  </Text>
                ) : (
                  detalles.map((d, i) => (
                    <View key={d.id_detalle || i}>
                      <FilaDetalle item={d} />
                      {i < detalles.length - 1 && (
                        <View style={styles.separador} />
                      )}
                    </View>
                  ))
                )}
              </View>

              {/* Total */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total del pedido</Text>
                <Text style={styles.totalValor}>
                  ${parseFloat(ordenDetalle.total || 0).toFixed(2)}
                </Text>
              </View>

              {/* Botón avanzar estado */}
              {SIGUIENTE_ESTADO[ordenDetalle.estado] && (
                <TouchableOpacity
                  style={styles.btnAvanzarModal}
                  onPress={() => {
                    avanzarEstado(ordenDetalle);
                  }}
                >
                  <Ionicons name="arrow-forward-circle-outline"
                    size={20} color="#fff" />
                  <Text style={styles.btnAvanzarModalTexto}>
                    Marcar como {SIGUIENTE_ESTADO[ordenDetalle.estado]}
                  </Text>
                </TouchableOpacity>
              )}

            </ScrollView>
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#f7f6f2' },
  center:              { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Filtros
  filtros:             { flexDirection: 'row', backgroundColor: '#fff',
                         paddingVertical: 10, paddingHorizontal: 8,
                         borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  filtroBtn:           { flex: 1, alignItems: 'center', paddingVertical: 6,
                         borderRadius: 8, marginHorizontal: 2,
                         flexDirection: 'row', justifyContent: 'center', gap: 4 },
  filtroBtnActivo:     { backgroundColor: '#e8f5e9' },
  filtroTexto:         { fontSize: 10, color: '#7a7974',
                         fontWeight: '600', textAlign: 'center' },
  filtroTextoActivo:   { color: '#01696f' },
  filtroBadge:         { backgroundColor: '#01696f', borderRadius: 8,
                         minWidth: 16, height: 16,
                         justifyContent: 'center', alignItems: 'center' },
  filtroBadgeTexto:    { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  // Cards
  card:                { backgroundColor: '#fff', margin: 8, marginHorizontal: 12,
                         borderRadius: 12, padding: 14, elevation: 2 },
  cardHeader:          { flexDirection: 'row', justifyContent: 'space-between',
                         alignItems: 'center', marginBottom: 8 },
  folio:               { fontSize: 15, fontWeight: '700', color: '#28251d' },
  badge:               { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto:          { fontSize: 11, fontWeight: '600' },
  cliente:             { fontSize: 13, color: '#28251d', marginBottom: 3 },
  hora:                { fontSize: 13, color: '#7a7974', marginBottom: 3 },
  total:               { fontSize: 13, color: '#01696f',
                         fontWeight: '600', marginBottom: 10 },
  cardFooter:          { flexDirection: 'row', justifyContent: 'space-between',
                         alignItems: 'center' },
  verDetalle:          { fontSize: 13, color: '#01696f', fontWeight: '500' },
  btnAvanzar:          { backgroundColor: '#01696f', borderRadius: 8,
                         paddingVertical: 7, paddingHorizontal: 12,
                         flexDirection: 'row', alignItems: 'center', gap: 5 },
  btnAvanzarTexto:     { color: '#fff', fontWeight: '600', fontSize: 12 },

  // Vacío
  vacio:               { alignItems: 'center', marginTop: 80, gap: 12 },
  vacioTexto:          { fontSize: 15, color: '#7a7974' },

  // Modal
  modal:               { flex: 1, backgroundColor: '#f7f6f2' },
  modalHeader:         { backgroundColor: '#01696f', flexDirection: 'row',
                         justifyContent: 'space-between', alignItems: 'center',
                         padding: 16, paddingTop: 52 },
  modalTitulo:         { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  // Secciones del detalle
  seccion:             { backgroundColor: '#fff', marginHorizontal: 12,
                         marginBottom: 4, borderRadius: 12, overflow: 'hidden' },
  seccionTitulo:       { fontSize: 13, fontWeight: '700', color: '#7a7974',
                         marginHorizontal: 16, marginTop: 16,
                         marginBottom: 6, letterSpacing: 0.5 },
  seccionRow:          { flexDirection: 'row', justifyContent: 'space-between',
                         alignItems: 'center', padding: 12, paddingHorizontal: 16,
                         borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  seccionLabel:        { fontSize: 13, color: '#7a7974' },
  seccionValor:        { fontSize: 13, color: '#28251d', maxWidth: '60%',
                         textAlign: 'right' },
  seccionValorBold:    { fontSize: 14, fontWeight: '700', color: '#28251d' },

  // Detalle productos
  filaDetalle:         { flexDirection: 'row', alignItems: 'center',
                         padding: 12, paddingHorizontal: 16 },
  detalleImagen:       { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  detalleImagenVacia:  { width: 48, height: 48, borderRadius: 8,
                         backgroundColor: '#f5f5f5', justifyContent: 'center',
                         alignItems: 'center', marginRight: 12 },
  detalleInfo:         { flex: 1 },
  detalleNombre:       { fontSize: 14, fontWeight: '600', color: '#28251d' },
  detalleNotas:        { fontSize: 12, color: '#7a7974', marginTop: 2 },
  detalleRight:        { alignItems: 'flex-end' },
  detalleCantidad:     { fontSize: 14, fontWeight: '700', color: '#01696f' },
  detallePrecio:       { fontSize: 13, color: '#7a7974' },
  separador:           { height: 1, backgroundColor: '#f0f0f0',
                         marginHorizontal: 16 },
  sinDetalles:         { padding: 20, textAlign: 'center', color: '#7a7974' },

  // Total
  totalRow:            { flexDirection: 'row', justifyContent: 'space-between',
                         alignItems: 'center', backgroundColor: '#fff',
                         marginHorizontal: 12, marginTop: 4,
                         borderRadius: 12, padding: 16 },
  totalLabel:          { fontSize: 15, fontWeight: '600', color: '#28251d' },
  totalValor:          { fontSize: 20, fontWeight: 'bold', color: '#01696f' },

  // Botón avanzar en modal
  btnAvanzarModal:     { backgroundColor: '#01696f', margin: 16,
                         borderRadius: 12, padding: 16,
                         flexDirection: 'row', justifyContent: 'center',
                         alignItems: 'center', gap: 8 },
  btnAvanzarModalTexto:{ color: '#fff', fontWeight: '700', fontSize: 15 },
});