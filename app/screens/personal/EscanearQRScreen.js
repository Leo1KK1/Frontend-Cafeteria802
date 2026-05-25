import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

export default function EscanearQRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [escaneando,  setEscaneando]    = useState(true);
  const [procesando,  setProcesando]    = useState(false);
  const [activo,      setActivo]        = useState(true);
  const ultimoQR = useRef(null);

  // Reactivar escáner al volver a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      setActivo(true);
      setEscaneando(true);
      ultimoQR.current = null;
    }, [])
  );

  if (!permission) return <View style={styles.center}><ActivityIndicator color="#01696f" /></View>;

  if (!permission.granted) return (
    <View style={styles.center}>
      <Ionicons name="camera-outline" size={64} color="#ccc" />
      <Text style={styles.permisoTexto}>Se necesita acceso a la cámara</Text>
      <TouchableOpacity style={styles.btnPermiso} onPress={requestPermission}>
        <Text style={styles.btnPermisoTexto}>Permitir Cámara</Text>
      </TouchableOpacity>
    </View>
  );

  const onQRLeido = async ({ data }) => {
    if (!escaneando || !activo || procesando) return;
    if (ultimoQR.current === data) return; // evitar doble scan
    ultimoQR.current = data;
    setEscaneando(false);
    setProcesando(true);

    try {
      // Buscar la orden por folio o valor_qr
      const { data: ordenes } = await api.get('/ordenes');
      const orden = ordenes.find(
        o => o.folio_orden === data || o.valor_qr === data
      );

      if (!orden) {
        Alert.alert('❌ QR Inválido', 'No se encontró ningún pedido con este código.', [
          { text: 'Escanear otro', onPress: () => { setEscaneando(true); setProcesando(false); ultimoQR.current = null; } }
        ]);
        return;
      }

      if (orden.estado === 'ENTREGADA') {
        Alert.alert('Ya entregado', `El pedido ${orden.folio_orden} ya fue entregado.`, [
          { text: 'OK', onPress: () => { setEscaneando(true); setProcesando(false); ultimoQR.current = null; } }
        ]);
        return;
      }

      if (orden.estado !== 'LISTA') {
        Alert.alert('No está listo', `El pedido está en estado: ${orden.estado}`, [
          { text: 'OK', onPress: () => { setEscaneando(true); setProcesando(false); ultimoQR.current = null; } }
        ]);
        return;
      }

      // Marcar como ENTREGADA
      Alert.alert(
        'Pedido Encontrado',
        `Folio: ${orden.folio_orden}\nCliente: ${orden.usuarios?.nombre_completo || 'N/A'}\nTotal: $${parseFloat(orden.total).toFixed(2)}\n\n¿Marcar como ENTREGADA?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => { setEscaneando(true); setProcesando(false); ultimoQR.current = null; }
          },
          {
            text: 'Entregar',
            onPress: async () => {
              await api.patch(`/ordenes/${orden.id_orden}/estado`, { estado: 'ENTREGADA' });
              Alert.alert('🎉 Entregado', `Pedido ${orden.folio_orden} marcado como entregado.`, [
                { text: 'OK', onPress: () => { setEscaneando(true); setProcesando(false); ultimoQR.current = null; } }
              ]);
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'No se pudo procesar el QR');
      setEscaneando(true);
      setProcesando(false);
      ultimoQR.current = null;
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={escaneando && !procesando ? onQRLeido : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay oscuro */}
      <View style={styles.overlay}>
        <Text style={styles.instruccion}>Apunta al código QR del pedido</Text>

        {/* Marco del escáner */}
        <View style={styles.marco}>
          <View style={[styles.esquina, styles.esquinaTL]} />
          <View style={[styles.esquina, styles.esquinaTR]} />
          <View style={[styles.esquina, styles.esquinaBL]} />
          <View style={[styles.esquina, styles.esquinaBR]} />
          {procesando && (
            <View style={styles.procesando}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.procesandoTexto}>Verificando...</Text>
            </View>
          )}
        </View>

        <Text style={styles.subInstruccion}>
          {procesando ? 'Procesando código...' : 'El código se detecta automáticamente'}
        </Text>
      </View>
    </View>
  );
}

const MARCO = 250;
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#000' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center',
                     backgroundColor: '#f7f6f2', gap: 16 },
  permisoTexto:    { fontSize: 16, color: '#7a7974', textAlign: 'center', paddingHorizontal: 40 },
  btnPermiso:      { backgroundColor: '#01696f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnPermisoTexto: { color: '#fff', fontWeight: '600' },

  overlay:         { flex: 1, justifyContent: 'center', alignItems: 'center',
                     backgroundColor: 'rgba(0,0,0,0.5)' },
  instruccion:     { color: '#fff', fontSize: 16, fontWeight: '600',
                     marginBottom: 32, textAlign: 'center' },
  marco:           { width: MARCO, height: MARCO, justifyContent: 'center', alignItems: 'center' },
  esquina:         { position: 'absolute', width: 30, height: 30, borderColor: '#01696f', borderWidth: 3 },
  esquinaTL:       { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  esquinaTR:       { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  esquinaBL:       { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  esquinaBR:       { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  procesando:      { alignItems: 'center', gap: 8 },
  procesandoTexto: { color: '#fff', fontSize: 14 },
  subInstruccion:  { color: 'rgba(255,255,255,0.7)', fontSize: 13,
                     marginTop: 32, textAlign: 'center', paddingHorizontal: 40 },
});