import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen  from '../screens/admin/DashboardScreen';
import ProductosScreen  from '../screens/admin/ProductosScreen';
import InventarioScreen from '../screens/admin/InventarioScreen';
import PerfilPersonalScreen from '../screens/personal/PerfilPersonalScreen'; // reutilizar

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarActiveTintColor: '#01696f',
      tabBarInactiveTintColor: '#999',
      tabBarIcon: ({ color, size }) => {
        const icons = {
          Dashboard:  'stats-chart-outline',
          Productos:  'fast-food-outline',
          Inventario: 'cube-outline',
          Perfil:     'person-outline',
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      }
    })}>
      <Tab.Screen name="Dashboard"  component={DashboardScreen}      options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Productos"  component={ProductosScreen}      options={{ title: 'Productos' }} />
      <Tab.Screen name="Inventario" component={InventarioScreen}     options={{ title: 'Inventario' }} />
      <Tab.Screen name="Perfil"     component={PerfilPersonalScreen} options={{ title: 'Perfil', headerShown: false }} />
    </Tab.Navigator>
  );
}
