import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, SectionList, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useCarrito } from '../../context/CarritoContext';

export default function MenuScreen({ navigation }) {
  const [secciones, setSecciones]   = useState([]);
  const [cargando, setCargando]     = useState(true);
  const { agregarItem, totalItems } = useCarrito();

  useEffect(() => {
    cargarMenu();
  }, []);

  const cargarMenu = async () => {
    try {
      const { data: categorias } = await api.get('/categorias');
      const { data: productos  } = await api.get('/productos');

      const secs = categorias
        .filter(c => c.activa)
        .map(cat => ({
          title: cat.nombre,
          data:  productos.filter(p => p.id_categoria === cat.id_categoria && p.disponible)
        }))
        .filter(s => s.data.length > 0);

      setSecciones(secs);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el menú');
    } finally {
      setCargando(false);
    }
  };

  const renderProducto = ({ item }) => (
    <View style={styles.card}>
      {item.imagen_url ? (
        <Image
          source={{ uri: item.imagen_url }}
          style={styles.imagen}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagenPlaceholder}>
          <Ionicons name="image-outline" size={22} color="#ccc" />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.desc}>{item.descripcion}</Text>
        <Text style={styles.precio}>${parseFloat(item.precio).toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.btnAgregar} onPress={() => {
        agregarItem(item);
        Alert.alert('', `${item.nombre} Agregado al carrito`);
      }}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  if (cargando) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#01696f" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header con badge del carrito */}
      <View style={styles.header}>
        <Text style={styles.titulo}>☕ Menú del Día</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Carrito')} style={styles.carritoBtn}>
          <Ionicons name="cart-outline" size={28} color="#01696f" />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <SectionList
        sections={secciones}
        keyExtractor={item => item.id_producto.toString()}
        renderItem={renderProducto}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.seccion}>
            <Text style={styles.seccionTexto}>{title}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f7f6f2' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:       { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', padding: 16, backgroundColor: '#fff',
                  borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  titulo:       { fontSize: 20, fontWeight: 'bold', color: '#01696f' },
  carritoBtn:   { position: 'relative', padding: 4 },
  badge:        { position: 'absolute', top: -4, right: -4, backgroundColor: '#e53935',
                  borderRadius: 10, minWidth: 18, height: 18,
                  justifyContent: 'center', alignItems: 'center' },
  badgeText:    { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  seccion:      { backgroundColor: '#e8f5e9', paddingHorizontal: 16,
                  paddingVertical: 8, marginTop: 8 },
  seccionTexto: { fontSize: 14, fontWeight: '700', color: '#01696f', textTransform: 'uppercase' },
  card:         { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 12,
                  marginVertical: 4, borderRadius: 10, padding: 12,
                  alignItems: 'center', elevation: 1 },
  imagen:       { width: 64, height: 64, borderRadius: 8, marginRight: 10 },
  imagenPlaceholder: { width: 64, height: 64, borderRadius: 8, marginRight: 10,
                       backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  cardInfo:     { flex: 1 },
  nombre:       { fontSize: 16, fontWeight: '600', color: '#28251d' },
  desc:         { fontSize: 13, color: '#7a7974', marginVertical: 2 },
  precio:       { fontSize: 15, fontWeight: 'bold', color: '#01696f' },
  btnAgregar:   { backgroundColor: '#01696f', borderRadius: 8,
                  padding: 8, marginLeft: 10 },
});
