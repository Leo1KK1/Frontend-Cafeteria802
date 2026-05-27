import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const KPI = ({ icono, label, valor, color, sub }) => (
  <View style={[styles.kpi, { borderLeftColor: color }]}>
    <View style={[styles.kpiIcono, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icono} size={24} color={color} />
    </View>
    <View style={styles.kpiInfo}>
      <Text style={styles.kpiValor}>{valor}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  </View>
);

export default function DashboardScreen() {
  const [stats,      setStats]      = useState(null);
  const [ordenes,    setOrdenes]    = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { cargarDatos(); }, []));

  const cargarDatos = async () => {
    try {
      const [resOrdenes, resProductos, resUsuarios] = await Promise.all([
        api.get('/ordenes'),
        api.get('/productos'),
        api.get('/usuarios'),
      ]);

      const hoy = new Date().toDateString();
      const ordenesHoy  = resOrdenes.data.filter(o =>
        new Date(o.creado_en).toDateString() === hoy
      );
      const ingresoHoy  = ordenesHoy
        .filter(o => o.estado !== 'CANCELADA')
        .reduce((s, o) => s + parseFloat(o.total || 0), 0);
      const pendientes  = resOrdenes.data.filter(o =>
        ['PENDIENTE','CONFIRMADA','PREPARANDO'].includes(o.estado)
      ).length;

      setStats({
        totalOrdenes:   ordenesHoy.length,
        ingresoHoy,
        pendientes,
        totalProductos: resProductos.data.length,
        totalUsuarios:  resUsuarios.data.length,
        entregadas:     ordenesHoy.filter(o => o.estado === 'ENTREGADA').length,
      });
      // Últimas 5 órdenes
      setOrdenes(resOrdenes.data.slice(0, 5));
    } catch (e) {
      console.error(e);
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
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); cargarDatos(); }} colors={['#01696f']} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>☕ PANEL ADMINISTRADOR</Text>
        <Text style={styles.headerFecha}>
          {new Date().toLocaleDateString('es-MX',
            { weekday:'long', day:'numeric', month:'long' })}
        </Text>
      </View>

      {/* KPIs */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>HOY</Text>
        <KPI icono="receipt-outline"       label="Pedidos hoy"       valor={stats?.totalOrdenes} color="#01696f" />
        <KPI icono="cash-outline"          label="Ingresos hoy"      valor={`$${stats?.ingresoHoy.toFixed(2)}`} color="#2e7d32" sub="Solo pedidos no cancelados"/>
        <KPI icono="time-outline"          label="En proceso"        valor={stats?.pendientes}   color="#e65100" sub="Pendiente + Confirmada + Preparando"/>
        <KPI icono="checkmark-done-outline"label="Entregados hoy"    valor={stats?.entregadas}   color="#1565c0" />
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>GENERAL</Text>
        <KPI icono="fast-food-outline"   label="Productos activos" valor={stats?.totalProductos} color="#6a1b9a" />
        <KPI icono="people-outline"      label="Usuarios registrados" valor={stats?.totalUsuarios} color="#01696f" />
      </View>

      {/* Últimas órdenes */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>ÚLTIMOS PEDIDOS</Text>
        {ordenes.map(o => (
          <View key={o.id_orden} style={styles.ordenRow}>
            <View>
              <Text style={styles.ordenFolio}>{o.folio_orden}</Text>
              <Text style={styles.ordenCliente}>{o.usuarios?.nombre_completo || 'N/A'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.ordenTotal}>${parseFloat(o.total || 0).toFixed(2)}</Text>
              <View style={[styles.estadoBadge,
                { backgroundColor: o.estado === 'ENTREGADA' ? '#e8f5e9' : '#fff3e0' }]}>
                <Text style={[styles.estadoTexto,
                  { color: o.estado === 'ENTREGADA' ? '#2e7d32' : '#e65100' }]}>
                  {o.estado}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f7f6f2' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:       { backgroundColor: '#01696f', padding: 24, paddingTop: 50 },
  headerTitulo: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerFecha:  { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2, textTransform: 'capitalize' },
  seccion:      { backgroundColor: '#fff', margin: 12, borderRadius: 12, overflow: 'hidden' },
  seccionTitulo:{ fontSize: 11, fontWeight: '700', color: '#7a7974',
                  paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, letterSpacing: 1 },
  kpi:          { flexDirection: 'row', alignItems: 'center', padding: 14,
                  borderTopWidth: 1, borderTopColor: '#f0f0f0', borderLeftWidth: 4 },
  kpiIcono:     { width: 44, height: 44, borderRadius: 10,
                  justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  kpiInfo:      { flex: 1 },
  kpiValor:     { fontSize: 22, fontWeight: 'bold', color: '#28251d' },
  kpiLabel:     { fontSize: 13, color: '#7a7974' },
  kpiSub:       { fontSize: 11, color: '#bab9b4', marginTop: 1 },
  ordenRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  padding: 12, paddingHorizontal: 16,
                  borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  ordenFolio:   { fontSize: 13, fontWeight: '700', color: '#28251d' },
  ordenCliente: { fontSize: 12, color: '#7a7974' },
  ordenTotal:   { fontSize: 14, fontWeight: 'bold', color: '#01696f' },
  estadoBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 3 },
  estadoTexto:  { fontSize: 10, fontWeight: '600' },
});