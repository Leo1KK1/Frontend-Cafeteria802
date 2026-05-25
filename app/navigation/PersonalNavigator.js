import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import PedidosScreen        from '../screens/personal/PedidosScreen';
import EscanearQRScreen     from '../screens/personal/EscanearQRScreen';
import PerfilPersonalScreen from '../screens/personal/PerfilPersonalScreen';

const Tab = createBottomTabNavigator();

export default function PersonalNavigator() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarActiveTintColor: '#01696f',
      tabBarInactiveTintColor: '#999',
      tabBarIcon: ({ color, size }) => {
        const icons = {
          Pedidos:    'list-outline',
          'Escanear': 'qr-code-outline',
          Perfil:     'person-outline',
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      }
    })}>
      <Tab.Screen name="Pedidos"  component={PedidosScreen}        options={{ title: 'Pedidos' }} />
      <Tab.Screen name="Escanear" component={EscanearQRScreen}     options={{ title: 'Escanear QR' }} />
      <Tab.Screen name="Perfil"   component={PerfilPersonalScreen} options={{ title: 'Perfil', headerShown: false }} />
    </Tab.Navigator>
  );
}
