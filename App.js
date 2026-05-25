import React from 'react';
import { AuthProvider }    from './app/context/AuthContext';
import { CarritoProvider } from './app/context/CarritoContext';
import RootNavigator       from './app/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <RootNavigator />
      </CarritoProvider>
    </AuthProvider>
  );
}
