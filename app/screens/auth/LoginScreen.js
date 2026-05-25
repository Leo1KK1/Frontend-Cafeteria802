import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [correo, setCorreo]       = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando]   = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const handleLogin = async () => {
    const correoNormalizado = correo.trim();
    if (!correoNormalizado || !contrasena) return Alert.alert('Error', 'Completa todos los campos');
    if (correoNormalizado !== correoNormalizado.toLowerCase()) {
      return Alert.alert('Error', 'El correo debe estar en minusculas');
    }
    setCargando(true);
    try {
      await login(correoNormalizado, contrasena);
      // RootNavigator redirige automáticamente según el rol
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Image
        source={require('../../../assets/icon_oreki.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.titulo}>Venado FOOD</Text>
      <Text style={styles.subtitulo}>Inicia sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={correo}
        onChangeText={(text) => setCorreo(text.toLowerCase())}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={styles.passwordWrap}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry={!mostrarContrasena}
        />
        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => setMostrarContrasena((prev) => !prev)}
        >
          <Ionicons
            name={mostrarContrasena ? 'eye-off' : 'eye'}
            size={20}
            color="#01696f"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={cargando}>
        {cargando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnTexto}>Entrar</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f7f6f2' },
  logo:       { width: 120, height: 120, alignSelf: 'center', marginBottom: 12 },
  titulo:     { fontSize: 32, fontWeight: 'bold', color: '#01696f', textAlign: 'center', marginBottom: 8 },
  subtitulo:  { fontSize: 18, color: '#7a7974', textAlign: 'center', marginBottom: 32 },
  input:      { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14,
                borderWidth: 1, borderColor: '#d4d1ca', fontSize: 16 },
  passwordWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10,
                   borderWidth: 1, borderColor: '#d4d1ca', marginBottom: 14 },
  passwordInput: { flex: 1, padding: 14, fontSize: 16 },
  toggleBtn:     { paddingHorizontal: 14, paddingVertical: 8 },
  btn:        { backgroundColor: '#01696f', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  btnTexto:   { color: '#fff', fontSize: 16, fontWeight: '600' },
  link:       { color: '#01696f', textAlign: 'center', fontSize: 14 },
});
