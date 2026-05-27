import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Modal, TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function InventarioScreen() {
  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ajusteVisible, setAjusteVisible] = useState(false);
  const [movVisible, setMovVisible] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [nuevoStock, setNuevoStock] = useState('');
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMov, setCargandoMov] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    id_producto: '',
    stock_actual: '',
    stock_minimo: '',
    stock_maximo: '',
  });

  useFocusEffect(useCallback(() => { cargarDatos(); }, []));

  const cargarDatos = async () => {
    try {
      const [resInv, resProd] = await Promise.all([
        api.get('/inventario'),
        api.get('/productos'),
      ]);
      setInventario(resInv.data);
      setProductos(resProd.data || []);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el inventario');
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm({ id_producto: '', stock_actual: '', stock_minimo: '', stock_maximo: '' });
    setFormVisible(true);
  };

  const abrirEditar = (item) => {
    setEditando(item);
    setForm({
      id_producto: String(item.id_producto),
      stock_actual: String(item.stock_actual ?? 0),
      stock_minimo: String(item.stock_minimo ?? 0),
      stock_maximo: String(item.stock_maximo ?? 0),
    });
    setFormVisible(true);
  };

  const guardarInventario = async () => {
    if (!form.id_producto) {
      Alert.alert('Error', 'Selecciona un producto');
      return;
    }
    const stockActual = parseInt(form.stock_actual, 10);
    const stockMinimo = parseInt(form.stock_minimo, 10);
    const stockMaximo = parseInt(form.stock_maximo, 10);
    if ([stockActual, stockMinimo, stockMaximo].some(v => Number.isNaN(v) || v < 0)) {
      Alert.alert('Error', 'Los stocks deben ser numeros validos');
      return;
    }
    try {
      const payload = {
        id_producto: parseInt(form.id_producto, 10),
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        stock_maximo: stockMaximo,
      };
      if (editando) {
        const { data } = await api.put(`/inventario/${editando.id_inventario}`, payload);
        setInventario(prev => prev.map(i =>
          i.id_inventario === data.id_inventario ? { ...i, ...data } : i
        ));
      } else {
        const { data } = await api.post('/inventario', payload);
        setInventario(prev => [data, ...prev]);
      }
      setFormVisible(false);
      setEditando(null);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'No se pudo guardar');
    }
  };

  const abrirAjuste = (item) => {
    setSeleccionado(item);
    setNuevoStock(String(item.stock_actual ?? 0));
    setAjusteVisible(true);
  };

  const guardarAjuste = async () => {
    const valor = parseInt(nuevoStock, 10);
    if (Number.isNaN(valor) || valor < 0) {
      Alert.alert('Error', 'Ingresa un stock valido');
      return;
    }
    try {
      const { data } = await api.put(`/inventario/${seleccionado.id_inventario}`, {
        stock_actual: valor,
      });
      setInventario(prev => prev.map(i =>
        i.id_inventario === data.id_inventario ? { ...i, ...data } : i
      ));
      setAjusteVisible(false);
      setSeleccionado(null);
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el stock');
    }
  };

  const abrirMovimientos = async (item) => {
    setSeleccionado(item);
    setMovVisible(true);
    setCargandoMov(true);
    try {
      const { data } = await api.get(`/movimientos-inventario/inventario/${item.id_inventario}`);
      setMovimientos(data);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los movimientos');
    } finally {
      setCargandoMov(false);
    }
  };

  if (cargando) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#01696f" /></View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={inventario}
        keyExtractor={i => i.id_inventario.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); cargarDatos(); }}
            colors={['#01696f']} />
        }
        renderItem={({ item }) => {
          const stockActual = item.stock_actual ?? 0;
          const stockMinimo = item.stock_minimo ?? 0;
          const bajoStock = stockActual < stockMinimo;
          return (
          <View style={[styles.card, bajoStock && styles.cardBajo]}>
            <View style={styles.iconoWrap}>
              <Ionicons name="cube-outline" size={24} color="#01696f" />
            </View>
            <View style={styles.info}>
              <Text style={styles.nombre}>{item.productos?.nombre || 'Producto'}</Text>
              <Text style={styles.precio}>
                ${parseFloat(item.productos?.precio || 0).toFixed(2)}
              </Text>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Stock actual:</Text>
                <Text style={[styles.stockValor, bajoStock && styles.stockValorBajo]}>
                  {stockActual}
                </Text>
              </View>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Minimo:</Text>
                <Text style={styles.stockValor}>{stockMinimo}</Text>
              </View>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Maximo:</Text>
                <Text style={styles.stockValor}>{item.stock_maximo ?? 0}</Text>
              </View>
              <View style={styles.accionesRow}>
                <TouchableOpacity
                  style={styles.btnAccion}
                  onPress={() => abrirAjuste(item)}
                >
                  <Ionicons name="create-outline" size={16} color="#1565c0" />
                  <Text style={styles.btnAccionTexto}>Ajustar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnAccion}
                  onPress={() => abrirEditar(item)}
                >
                  <Ionicons name="pencil-outline" size={16} color="#6a1b9a" />
                  <Text style={styles.btnAccionTexto}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnAccion}
                  onPress={() => abrirMovimientos(item)}
                >
                  <Ionicons name="list-outline" size={16} color="#01696f" />
                  <Text style={styles.btnAccionTexto}>Movimientos</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={abrirCrear}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Modal ajuste */}
      <Modal
        visible={ajusteVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAjusteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Ajustar stock</Text>
            <Text style={styles.modalSubtitulo}>
              {seleccionado?.productos?.nombre || 'Producto'}
            </Text>
            <TextInput
              style={styles.input}
              value={nuevoStock}
              onChangeText={setNuevoStock}
              keyboardType="number-pad"
              placeholder="0"
            />
            <View style={styles.modalAcciones}>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnCancelar]}
                onPress={() => setAjusteVisible(false)}
              >
                <Text style={styles.btnModalTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnGuardar]}
                onPress={guardarAjuste}
              >
                <Text style={styles.btnModalTexto}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal movimientos */}
      <Modal
        visible={movVisible}
        animationType="slide"
        onRequestClose={() => setMovVisible(false)}
      >
        <View style={styles.modalMovimientos}>
          <View style={styles.movHeader}>
            <TouchableOpacity onPress={() => setMovVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.movTitulo}>Movimientos</Text>
            <View style={{ width: 24 }} />
          </View>
          {cargandoMov ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#01696f" />
            </View>
          ) : (
            <FlatList
              data={movimientos}
              keyExtractor={m => m.id_movimiento?.toString() || `${m.creado_en}`}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <Text style={styles.vacioMov}>Sin movimientos</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.movItem}>
                  <Text style={styles.movTipo}>{item.tipo_movimiento}</Text>
                  <Text style={styles.movCantidad}>Cantidad: {item.cantidad}</Text>
                  {item.motivo ? (
                    <Text style={styles.movMotivo}>Motivo: {item.motivo}</Text>
                  ) : null}
                  <Text style={styles.movFecha}>
                    {new Date(item.creado_en).toLocaleString('es-MX')}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Modal crear/editar */}
      <Modal
        visible={formVisible}
        animationType="slide"
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.modalMovimientos}>
          <View style={styles.movHeader}>
            <TouchableOpacity onPress={() => setFormVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.movTitulo}>
              {editando ? 'Editar inventario' : 'Nuevo inventario'}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.formBody}>
            <Text style={styles.formLabel}>Producto *</Text>
            <View style={styles.productosList}>
              <FlatList
                data={productos}
                keyExtractor={p => p.id_producto.toString()}
                renderItem={({ item }) => {
                  const activo = form.id_producto === String(item.id_producto);
                  return (
                    <TouchableOpacity
                      style={[styles.prodItem, activo && styles.prodItemActivo]}
                      onPress={() => setForm(prev => ({
                        ...prev,
                        id_producto: String(item.id_producto),
                      }))}
                      disabled={!!editando}
                    >
                      <Text style={[styles.prodTexto, activo && styles.prodTextoActivo]}>
                        {item.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
            <Text style={styles.formLabel}>Stock actual *</Text>
            <TextInput
              style={styles.input}
              value={form.stock_actual}
              onChangeText={v => setForm(prev => ({ ...prev, stock_actual: v }))}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Text style={styles.formLabel}>Stock minimo *</Text>
            <TextInput
              style={styles.input}
              value={form.stock_minimo}
              onChangeText={v => setForm(prev => ({ ...prev, stock_minimo: v }))}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Text style={styles.formLabel}>Stock maximo *</Text>
            <TextInput
              style={styles.input}
              value={form.stock_maximo}
              onChangeText={v => setForm(prev => ({ ...prev, stock_maximo: v }))}
              keyboardType="number-pad"
              placeholder="0"
            />
            <View style={styles.modalAcciones}>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnCancelar]}
                onPress={() => setFormVisible(false)}
              >
                <Text style={styles.btnModalTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnGuardar]}
                onPress={guardarInventario}
              >
                <Text style={styles.btnModalTexto}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f7f6f2' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card:         { flexDirection: 'row', backgroundColor: '#fff', margin: 8, marginHorizontal: 12,
                  borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  cardBajo:     { borderWidth: 1, borderColor: '#ef9a9a', backgroundColor: '#fff5f5' },
  iconoWrap:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e8f5e9',
                  justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info:         { flex: 1 },
  nombre:       { fontSize: 14, fontWeight: '700', color: '#28251d', marginBottom: 2 },
  precio:       { fontSize: 13, color: '#01696f', fontWeight: '600', marginBottom: 6 },
  stockRow:     { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  stockLabel:   { fontSize: 12, color: '#7a7974' },
  stockValor:   { fontSize: 12, fontWeight: '700', color: '#28251d' },
  stockValorBajo: { color: '#c62828' },
  accionesRow:  { flexDirection: 'row', gap: 8, marginTop: 10 },
  btnAccion:    { flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: '#f1f5f4', paddingHorizontal: 10,
                  paddingVertical: 6, borderRadius: 8 },
  btnAccionTexto:{ fontSize: 12, color: '#28251d', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
                  justifyContent: 'center', padding: 20 },
  modalCard:    { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitulo:  { fontSize: 16, fontWeight: '700', color: '#28251d' },
  modalSubtitulo:{ fontSize: 12, color: '#7a7974', marginTop: 4, marginBottom: 12 },
  input:        { backgroundColor: '#fff', borderRadius: 10, padding: 12,
                  borderWidth: 1, borderColor: '#d4d1ca', fontSize: 14 },
  modalAcciones:{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  btnModal:     { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  btnCancelar:  { backgroundColor: '#e0e0e0' },
  btnGuardar:   { backgroundColor: '#01696f' },
  btnModalTexto:{ color: '#fff', fontWeight: '600', fontSize: 13 },
  modalMovimientos:{ flex: 1, backgroundColor: '#f7f6f2' },
  movHeader:    { backgroundColor: '#01696f', padding: 16, paddingTop: 52,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  movTitulo:    { color: '#fff', fontSize: 17, fontWeight: '700' },
  movItem:      { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 },
  movTipo:      { fontSize: 13, fontWeight: '700', color: '#01696f' },
  movCantidad:  { fontSize: 12, color: '#28251d', marginTop: 2 },
  movMotivo:    { fontSize: 12, color: '#7a7974', marginTop: 2 },
  movFecha:     { fontSize: 11, color: '#9e9e9e', marginTop: 6 },
  vacioMov:     { textAlign: 'center', color: '#7a7974', marginTop: 40 },
  fab:          { position: 'absolute', bottom: 20, right: 20, zIndex: 10,
                  backgroundColor: '#01696f', width: 54, height: 54,
                  borderRadius: 27, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  formBody:     { padding: 16 },
  formLabel:    { fontSize: 12, fontWeight: '700', color: '#28251d', marginBottom: 6 },
  productosList:{ maxHeight: 180, backgroundColor: '#fff', borderRadius: 10,
                  borderWidth: 1, borderColor: '#d4d1ca', marginBottom: 12 },
  prodItem:     { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1,
                  borderBottomColor: '#f0f0f0' },
  prodItemActivo:{ backgroundColor: '#e8f5e9' },
  prodTexto:    { fontSize: 13, color: '#28251d' },
  prodTextoActivo:{ color: '#01696f', fontWeight: '700' },
});