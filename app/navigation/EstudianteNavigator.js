import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import MenuScreen    from '../screens/estudiante/MenuScreen';
import CarritoScreen from '../screens/estudiante/CarritoScreen';
import OrdenesScreen from '../screens/estudiante/OrdenesScreen';
import QRScreen      from '../screens/estudiante/QRScreen';
import PerfilScreen  from '../screens/estudiante/PerfilScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function PedidosStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Pedidos" component={OrdenesScreen} options={{ title: 'Mis Pedidos' }} />
      <Stack.Screen name="QR"      component={QRScreen}      options={{ title: 'Comprobante QR' }} />
    </Stack.Navigator>
  );
}

export default function EstudianteNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor:   '#01696f',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { borderTopWidth: 1, borderTopColor: '#e0e0e0' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Menu:       'restaurant-outline',
            Carrito:    'cart-outline',
            MisPedidos: 'receipt-outline',
            Perfil:     'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Menu"       component={MenuScreen}    options={{ title: 'Menú',    headerShown: false }} />
      <Tab.Screen name="Carrito"    component={CarritoScreen} options={{ title: 'Carrito' }} />
      <Tab.Screen name="MisPedidos" component={PedidosStack}  options={{ title: 'Pedidos', headerShown: false }} />
      <Tab.Screen name="Perfil"     component={PerfilScreen}  options={{ title: 'Perfil',  headerShown: false }} />
    </Tab.Navigator>
  );
}
