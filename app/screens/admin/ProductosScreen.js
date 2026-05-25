import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, Switch,
  Modal, TextInput, ScrollView, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy'; // ✅ SDK 54 sin warnings
import api from '../../services/api';

// ─── Formulario vacío ──────────────────────────────────────────
const FORM_VACIO = {
  nombre: '', descripcion: '', precio: '',
  id_categoria: '', disponible: true, imagen_url: ''
};

// ─── Campo de texto — definido FUERA para no perder foco en Android ──
const CampoTexto = ({ label, valor, onChange, placeholder,
                      keyboardType = 'default', multiline = false }) => (
  <View style={styles.campo}>
    <Text style={styles.campoLabel}>{label}</Text>
    <TextInput
      style={[styles.campoInput,
        multiline && { height: 80, textAlignVertical: 'top' }]}
      value={valor}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#bab9b4"
      keyboardType={keyboardType}
      multiline={multiline}
      autoCapitalize="none"
      autoCorrect={false}
    />
  </View>
);

// ─── Componente principal ──────────────────────────────────────
export default function ProductosScreen() {
  const [productos,    setProductos]    = useState([]);
  const [categorias,   setCategorias]   = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [form,         setForm]         = useState(FORM_VACIO);
  const [subiendoImg,  setSubiendoImg]  = useState(false);
  const [guardando,    setGuardando]    = useState(false);

  useFocusEffect(useCallback(() => { cargarDatos(); }, []));

  const cargarDatos = async () => {
    try {
      const [resProd, resCat] = await Promise.all([
        api.get('/productos'),
        api.get('/categorias'),
      ]);
      setProductos(resProd.data);
      setCategorias(resCat.data);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  // ── Modal ──────────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setModalVisible(true);
  };

  const abrirEditar = (producto) => {
    setEditando(producto);
    setForm({
      nombre:       producto.nombre        || '',
      descripcion:  producto.descripcion   || '',
      precio:       String(producto.precio || ''),
      id_categoria: String(producto.id_categoria || ''),
      disponible:   producto.disponible    ?? true,
      imagen_url:   producto.imagen_url    || '',
    });
    setModalVisible(true);
  };

  // ── Imagen ─────────────────────────────────────────────────
  const seleccionarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      await subirImagen(result.assets[0]);
    }
  };

  const subirImagen = async (asset) => {
    setSubiendoImg(true);
    try {
      // ✅ expo-file-system/legacy — readAsStringAsync con string 'base64'
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64',
      });

      const extension = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName  = `producto_${Date.now()}.${extension}`;
      const mimeType  = asset.mimeType ||
                        (extension === 'png' ? 'image/png' : 'image/jpeg');

      console.log('[Upload] Enviando:', fileName, mimeType,
                  '| base64 len:', base64.length);

      const { data } = await api.post('/productos/upload-imagen', {
        base64, fileName, mimeType,
      });

      console.log('[Upload] URL:', data.url);
      setForm(prev => ({ ...prev, imagen_url: data.url }));
    } catch (e) {
      console.log('[Upload] Error:', e.response?.data || e.message);
      Alert.alert('Error al subir imagen',
        e.response?.data?.error || e.message);
    } finally {
      setSubiendoImg(false);
    }
  };

  // ── Guardar ────────────────────────────────────────────────
  const guardar = async () => {
    if (!form.nombre.trim()) return Alert.alert('Error', 'El nombre es requerido');
    if (!form.precio)        return Alert.alert('Error', 'El precio es requerido');
    if (!form.id_categoria)  return Alert.alert('Error', 'Selecciona una categoría');

    setGuardando(true);
    try {
      const payload = {
        nombre:       form.nombre.trim(),
        descripcion:  form.descripcion.trim(),
        precio:       parseFloat(form.precio),
        id_categoria: parseInt(form.id_categoria),
        disponible:   form.disponible,
        imagen_url:   form.imagen_url || null,
      };
      if (editando) {
        await api.put(`/productos/${editando.id_producto}`, payload);
      } else {
        await api.post('/productos', payload);
      }
      setModalVisible(false);
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  // ── Toggle disponible ──────────────────────────────────────
  const toggleDisponible = async (producto) => {
    try {
      await api.put(`/productos/${producto.id_producto}`,
        { disponible: !producto.disponible });
      setProductos(prev => prev.map(p =>
        p.id_producto === producto.id_producto
          ? { ...p, disponible: !p.disponible } : p
      ));
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar');
    }
  };

  // ── Eliminar ───────────────────────────────────────────────
  const eliminar = (producto) => {
    Alert.alert('Eliminar Producto', `¿Eliminar "${producto.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/productos/${producto.id_producto}`);
            setProductos(prev =>
              prev.filter(p => p.id_producto !== producto.id_producto));
          } catch (e) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        }
      }
    ]);
  };

  // ── Render ─────────────────────────────────────────────────
  if (cargando) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#01696f" />
    </View>
  );

  return (
    <View style={styles.container}>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={abrirCrear}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <FlatList
        data={productos}
        keyExtractor={p => p.id_producto.toString()}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); cargarDatos(); }}
            colors={['#01696f']}
          />
        }
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name="fast-food-outline" size={56} color="#ccc" />
            <Text style={styles.vacioTexto}>No hay productos</Text>
            <TouchableOpacity style={styles.btnVacioAgregar} onPress={abrirCrear}>
              <Text style={styles.btnVacioTexto}>Agregar primer producto</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.disponible && styles.cardInactivo]}>
            {item.imagen_url ? (
              <Image source={{ uri: item.imagen_url }}
                style={styles.imagen} resizeMode="cover" />
            ) : (
              <View style={styles.imagenPlaceholder}>
                <Ionicons name="image-outline" size={28} color="#ccc" />
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.categoria}>
                {item.categorias?.nombre || 'Sin categoría'}
              </Text>
              <Text style={styles.desc} numberOfLines={1}>
                {item.descripcion}
              </Text>
              <Text style={styles.precio}>
                ${parseFloat(item.precio).toFixed(2)}
              </Text>
            </View>
            <View style={styles.acciones}>
              <Switch
                value={item.disponible}
                onValueChange={() => toggleDisponible(item)}
                trackColor={{ false: '#ddd', true: '#a5d6a7' }}
                thumbColor={item.disponible ? '#01696f' : '#f4f3f4'}
              />
              <TouchableOpacity style={styles.btnAccion}
                onPress={() => abrirEditar(item)}>
                <Ionicons name="pencil-outline" size={18} color="#1565c0" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAccion}
                onPress={() => eliminar(item)}>
                <Ionicons name="trash-outline" size={18} color="#c62828" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* ── Modal Crear / Editar ─────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>
              {editando ? 'Editar Producto' : 'Nuevo Producto'}
            </Text>
            <TouchableOpacity
              onPress={guardar}
              disabled={guardando || subiendoImg}
            >
              {guardando
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={[styles.modalGuardar,
                    subiendoImg && { opacity: 0.4 }]}>
                    Guardar
                  </Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Selector imagen */}
            <TouchableOpacity
              style={styles.imagenSelector}
              onPress={seleccionarImagen}
              disabled={subiendoImg}
            >
              {subiendoImg ? (
                <View style={styles.imagenCargando}>
                  <ActivityIndicator size="large" color="#01696f" />
                  <Text style={styles.imagenCargandoTexto}>
                    Subiendo imagen...
                  </Text>
                </View>
              ) : form.imagen_url ? (
                <Image source={{ uri: form.imagen_url }}
                  style={styles.imagenPreview} resizeMode="cover" />
              ) : (
                <View style={styles.imagenVacio}>
                  <Ionicons name="camera-outline" size={40} color="#01696f" />
                  <Text style={styles.imagenVacioTexto}>
                    Tocar para agregar imagen
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {form.imagen_url ? (
              <TouchableOpacity
                style={styles.btnCambiarImagen}
                onPress={seleccionarImagen}
                disabled={subiendoImg}
              >
                <Ionicons name="refresh-outline" size={16} color="#01696f" />
                <Text style={styles.btnCambiarImagenTexto}>Cambiar imagen</Text>
              </TouchableOpacity>
            ) : null}

            <CampoTexto
              label="Nombre *"
              valor={form.nombre}
              onChange={v => setForm(p => ({ ...p, nombre: v }))}
              placeholder="Ej. Chilaquiles verdes"
            />
            <CampoTexto
              label="Descripción"
              valor={form.descripcion}
              onChange={v => setForm(p => ({ ...p, descripcion: v }))}
              placeholder="Descripción del producto"
              multiline
            />
            <CampoTexto
              label="Precio *"
              valor={form.precio}
              onChange={v => setForm(p => ({ ...p, precio: v }))}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            {/* Categorías */}
            <View style={styles.campo}>
              <Text style={styles.campoLabel}>Categoría *</Text>
              {categorias.length === 0 ? (
                <Text style={{ color: '#7a7974', fontSize: 13 }}>
                  No hay categorías disponibles
                </Text>
              ) : (
                <View style={styles.categoriasGrid}>
                  {categorias.map(cat => (
                    <TouchableOpacity
                      key={cat.id_categoria}
                      style={[styles.categoriaBtn,
                        form.id_categoria === String(cat.id_categoria)
                          && styles.categoriaBtnActivo]}
                      onPress={() => setForm(p => ({
                        ...p, id_categoria: String(cat.id_categoria)
                      }))}
                    >
                      <Text style={[styles.categoriaBtnTexto,
                        form.id_categoria === String(cat.id_categoria)
                          && styles.categoriaBtnTextoActivo]}>
                        {cat.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Switch disponible */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.campoLabel}>Disponible en el menú</Text>
                <Text style={styles.switchDesc}>
                  {form.disponible
                    ? 'Visible para estudiantes'
                    : 'Oculto del menú'}
                </Text>
              </View>
              <Switch
                value={form.disponible}
                onValueChange={v => setForm(p => ({ ...p, disponible: v }))}
                trackColor={{ false: '#ddd', true: '#a5d6a7' }}
                thumbColor={form.disponible ? '#01696f' : '#f4f3f4'}
              />
            </View>

          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:               { flex: 1, backgroundColor: '#f7f6f2' },
  center:                  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  fab:                     { position: 'absolute', bottom: 20, right: 20, zIndex: 10,
                             backgroundColor: '#01696f', width: 56, height: 56,
                             borderRadius: 28, justifyContent: 'center',
                             alignItems: 'center', elevation: 6 },

  card:                    { flexDirection: 'row', backgroundColor: '#fff',
                             margin: 8, marginHorizontal: 12,
                             borderRadius: 12, overflow: 'hidden', elevation: 2 },
  cardInactivo:            { opacity: 0.5 },
  imagen:                  { width: 85, height: 85 },
  imagenPlaceholder:       { width: 85, height: 85, backgroundColor: '#f5f5f5',
                             justifyContent: 'center', alignItems: 'center' },
  cardInfo:                { flex: 1, padding: 10, justifyContent: 'center' },
  nombre:                  { fontSize: 14, fontWeight: '700', color: '#28251d' },
  categoria:               { fontSize: 11, color: '#01696f',
                             fontWeight: '600', marginBottom: 2 },
  desc:                    { fontSize: 12, color: '#7a7974' },
  precio:                  { fontSize: 15, fontWeight: 'bold',
                             color: '#01696f', marginTop: 4 },
  acciones:                { justifyContent: 'space-evenly',
                             alignItems: 'center', paddingHorizontal: 6 },
  btnAccion:               { padding: 8 },

  vacio:                   { alignItems: 'center', marginTop: 80, gap: 12 },
  vacioTexto:              { fontSize: 15, color: '#7a7974' },
  btnVacioAgregar:         { backgroundColor: '#01696f', paddingHorizontal: 20,
                             paddingVertical: 10, borderRadius: 8 },
  btnVacioTexto:           { color: '#fff', fontWeight: '600' },

  modal:                   { flex: 1, backgroundColor: '#f7f6f2' },
  modalHeader:             { backgroundColor: '#01696f', flexDirection: 'row',
                             justifyContent: 'space-between', alignItems: 'center',
                             padding: 16, paddingTop: 52 },
  modalTitulo:             { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  modalGuardar:            { fontSize: 16, color: '#fff', fontWeight: '700' },
  modalBody:               { padding: 16 },

  imagenSelector:          { backgroundColor: '#fff', borderRadius: 12, height: 190,
                             justifyContent: 'center', alignItems: 'center',
                             marginBottom: 8, overflow: 'hidden',
                             borderWidth: 1.5, borderColor: '#d4d1ca',
                             borderStyle: 'dashed' },
  imagenPreview:           { width: '100%', height: '100%' },
  imagenVacio:             { alignItems: 'center', gap: 8 },
  imagenVacioTexto:        { color: '#7a7974', fontSize: 14 },
  imagenCargando:          { alignItems: 'center', gap: 10 },
  imagenCargandoTexto:     { color: '#7a7974', fontSize: 13 },
  btnCambiarImagen:        { flexDirection: 'row', alignItems: 'center', gap: 6,
                             justifyContent: 'center', marginBottom: 12 },
  btnCambiarImagenTexto:   { color: '#01696f', fontSize: 13, fontWeight: '600' },

  campo:                   { marginBottom: 16 },
  campoLabel:              { fontSize: 13, fontWeight: '600',
                             color: '#28251d', marginBottom: 6 },
  campoInput:              { backgroundColor: '#fff', borderRadius: 10,
                             padding: 13, fontSize: 15, color: '#28251d',
                             borderWidth: 1, borderColor: '#d4d1ca' },

  categoriasGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoriaBtn:            { borderWidth: 1, borderColor: '#d4d1ca',
                             borderRadius: 20, paddingHorizontal: 14,
                             paddingVertical: 7, backgroundColor: '#fff' },
  categoriaBtnActivo:      { backgroundColor: '#01696f', borderColor: '#01696f' },
  categoriaBtnTexto:       { fontSize: 13, color: '#28251d' },
  categoriaBtnTextoActivo: { color: '#fff', fontWeight: '600' },

  switchRow:               { flexDirection: 'row', justifyContent: 'space-between',
                             alignItems: 'center', backgroundColor: '#fff',
                             borderRadius: 10, padding: 14, marginBottom: 16 },
  switchDesc:              { fontSize: 12, color: '#7a7974', marginTop: 2 },
});