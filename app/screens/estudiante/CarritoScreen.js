import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCarrito } from '../../context/CarritoContext';
import { useAuth }    from '../../context/AuthContext';
import api from '../../services/api';

export default function CarritoScreen({ navigation }) {
  const { items, agregarItem, quitarItem, limpiarCarrito, total } = useCarrito();
  const { usuario } = useAuth();
  const [notas, setNotas]       = useState('');
  const [cargando, setCargando] = useState(false);

  const confirmarOrden = () => {
    if (items.length === 0) return Alert.alert('Carrito vacío', 'Agrega productos al carrito');
    Alert.alert(
      'Confirmar Pedido',
      `Total: $${total.toFixed(2)}\n¿Deseas realizar el pedido?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: crearOrden }
      ]
    );
  };

  const crearOrden = async () => {
    setCargando(true);
    try {
      // 1. Crear la orden PRIMERO y guardar la respuesta en "orden"
      const { data: orden } = await api.post('/ordenes', {
        id_usuario:     usuario.id_usuario,
        notas:          notas || null,
        subtotal:       total,
        total:          total
      });

      //  2. Agregar cada producto como detalle usando orden.id_orden
      for (const item of items) {
        await api.post('/detalle-orden', {
          id_orden:        orden.id_orden,
          id_producto:     item.id_producto,
          cantidad:        item.cantidad,
          precio_unitario: item.precio,
          notas:           null
        });
      }

      // 3. Limpiar carrito y navegar
      limpiarCarrito();
      setNotas('');

      Alert.alert(
        '¡Pedido Realizado! ',
        `Folio: ${orden.folio_orden}\nTotal: $${total.toFixed(2)}`,
        [{ text: 'Ver mis pedidos', onPress: () => navigation.navigate('MisPedidos') }]
      );

    } catch (e) {
      console.error(e.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.error || 'No se pudo crear el pedido');
    } finally {
      setCargando(false);
    }
  };

  if (items.length === 0) return (
    <View style={styles.vacio}>
      <Ionicons name="cart-outline" size={64} color="#ccc" />
      <Text style={styles.vacioTexto}>Tu carrito está vacío</Text>
      <TouchableOpacity style={styles.btnIrMenu} onPress={() => navigation.navigate('Menu')}>
        <Text style={styles.btnIrMenuTexto}>Ver Menú</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={i => i.id_producto.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemNombre}>{item.nombre}</Text>
              <Text style={styles.itemPrecio}>
                ${(item.precio * item.cantidad).toFixed(2)}
              </Text>
              {item.cantidad > 1 && (
                <Text style={styles.itemUnitario}>
                  ${parseFloat(item.precio).toFixed(2)} c/u
                </Text>
              )}
            </View>
            <View style={styles.controles}>
              <TouchableOpacity
                style={styles.btnCtrl}
                onPress={() => quitarItem(item.id_producto)}
              >
                <Ionicons name="remove" size={18} color="#01696f" />
              </TouchableOpacity>
              <Text style={styles.cantidad}>{item.cantidad}</Text>
              <TouchableOpacity
                style={styles.btnCtrl}
                onPress={() => agregarItem(item)}
              >
                <Ionicons name="add" size={18} color="#01696f" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <TextInput
              style={styles.notas}
              placeholder="Notas para tu pedido (opcional)"
              value={notas}
              onChangeText={setNotas}
              multiline
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValor}>${total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.btnConfirmar, cargando && { opacity: 0.6 }]}
              onPress={confirmarOrden}
              disabled={cargando}
            >
              <Text style={styles.btnConfirmarTexto}>
                {cargando ? 'Procesando...' : 'Confirmar Pedido'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#f7f6f2' },
  vacio:             { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f6f2' },
  vacioTexto:        { fontSize: 18, color: '#7a7974', marginTop: 12, marginBottom: 20 },
  btnIrMenu:         { backgroundColor: '#01696f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnIrMenuTexto:    { color: '#fff', fontWeight: '600' },
  item:              { flexDirection: 'row', backgroundColor: '#fff', margin: 8,
                       marginHorizontal: 12, borderRadius: 10, padding: 12, alignItems: 'center' },
  itemNombre:        { fontSize: 15, fontWeight: '600', color: '#28251d' },
  itemPrecio:        { fontSize: 14, color: '#01696f', fontWeight: 'bold', marginTop: 2 },
  itemUnitario:      { fontSize: 12, color: '#7a7974' },
  controles:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnCtrl:           { borderWidth: 1, borderColor: '#01696f', borderRadius: 6, padding: 4 },
  cantidad:          { fontSize: 16, fontWeight: 'bold', minWidth: 24, textAlign: 'center' },
  footer:            { padding: 16 },
  notas:             { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12,
                       borderWidth: 1, borderColor: '#d4d1ca', fontSize: 14 },
  totalRow:          { flexDirection: 'row', justifyContent: 'space-between',
                       marginBottom: 16, paddingHorizontal: 4 },
  totalLabel:        { fontSize: 18, fontWeight: 'bold', color: '#28251d' },
  totalValor:        { fontSize: 18, fontWeight: 'bold', color: '#01696f' },
  btnConfirmar:      { backgroundColor: '#01696f', borderRadius: 10, padding: 16, alignItems: 'center' },
  btnConfirmarTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
