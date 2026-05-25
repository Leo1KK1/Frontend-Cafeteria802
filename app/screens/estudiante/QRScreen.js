import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function QRScreen({ route }) {
  const { orden } = route.params;
  const qrValue = orden.valor_qr || orden.folio_orden;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Tu Comprobante</Text>
      <Text style={styles.folio}>{orden.folio_orden}</Text>

      <View style={styles.qrBox}>
        <QRCode value={qrValue} size={220} color="#28251d" backgroundColor="#fff" />
      </View>

      <Text style={styles.instruccion}>
        Muestra este código al personal para recoger tu pedido
      </Text>

      <View style={styles.infoBox}>
        <InfoRow label="Estado"  value={orden.estado} />
        <InfoRow label="Total"   value={`$${parseFloat(orden.total).toFixed(2)}`} />
        {orden.notas && <InfoRow label="Notas" value={orden.notas} />}
      </View>
    </ScrollView>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:    { alignItems: 'center', padding: 24, backgroundColor: '#f7f6f2' },
  titulo:       { fontSize: 22, fontWeight: 'bold', color: '#01696f', marginBottom: 4 },
  folio:        { fontSize: 16, color: '#7a7974', marginBottom: 24 },
  qrBox:        { backgroundColor: '#fff', padding: 20, borderRadius: 16,
                  elevation: 3, marginBottom: 20 },
  instruccion:  { fontSize: 14, color: '#7a7974', textAlign: 'center',
                  maxWidth: 280, marginBottom: 24, lineHeight: 20 },
  infoBox:      { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between',
                  paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel:    { fontSize: 14, color: '#7a7974' },
  infoValue:    { fontSize: 14, fontWeight: '600', color: '#28251d' },
});
