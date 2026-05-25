import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';


const Campo = ({ label, campo, placeholder, keyboardType = 'default',
                 esPassword = false, verEstado, toggleVer,
                 valor, onChange, error }) => (
  <View style={styles.campo}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrap, error && styles.inputError]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#bab9b4"
        value={valor}
        onChangeText={onChange}
        keyboardType={keyboardType}
        secureTextEntry={esPassword && !verEstado}
        autoCapitalize={esPassword || campo === 'correo' ? 'none' : 'words'}
        autoCorrect={false}
      />
      {esPassword && (
        <TouchableOpacity onPress={toggleVer} style={styles.ojito}>
          <Ionicons
            name={verEstado ? 'eye-off-outline' : 'eye-outline'}
            size={20} color="#7a7974"
          />
        </TouchableOpacity>
      )}
    </View>
    {error && <Text style={styles.errorTexto}>⚠ {error}</Text>}
  </View>
);

export default function RegistroScreen({ navigation }) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo,         setCorreo]         = useState('');
  const [telefono,       setTelefono]       = useState('');
  const [contrasena,     setContrasena]     = useState('');
  const [confirmar,      setConfirmar]      = useState('');
  const [verPass,        setVerPass]        = useState(false);
  const [verConfirm,     setVerConfirm]     = useState(false);
  const [cargando,       setCargando]       = useState(false);
  const [errores,        setErrores]        = useState({});

  const validar = () => {
    const e = {};
    if (!nombreCompleto.trim())         e.nombre_completo = 'El nombre es requerido';
    if (!correo.includes('@'))          e.correo          = 'Correo inválido';
    if (contrasena.length < 6)          e.contrasena      = 'Mínimo 6 caracteres';
    if (contrasena !== confirmar)       e.confirmar       = 'Las contraseñas no coinciden';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const registrar = async () => {
    if (!validar()) return;
    setCargando(true);
    try {
      await api.post('/auth/registro', {
        nombre_completo: nombreCompleto.trim(),
        correo:          correo.trim().toLowerCase(),
        contrasena,
        telefono:        telefono.trim() || null,
        id_rol:          3
      });
      Alert.alert(
        '¡Registro exitoso!',
        'Tu cuenta fue creada. Inicia sesión para continuar.',
        [{ text: 'Ir al Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'No se pudo crear la cuenta');
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>☕</Text>
        </View>
        <Text style={styles.titulo}>Crear Cuenta</Text>
        <Text style={styles.titulo}>Venado FOOD</Text>
      </View>

      {/* Formulario */}
      <View style={styles.form}>

        <Campo
          label="Nombre completo"
          campo="nombre_completo"
          placeholder="Ej. Juan Pérez García"
          valor={nombreCompleto}
          onChange={setNombreCompleto}
          error={errores.nombre_completo}
        />
        <Campo
          label="Correo electrónico"
          campo="correo"
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          valor={correo}
          onChange={setCorreo}
          error={errores.correo}
        />
        <Campo
          label="Teléfono"
          campo="telefono"
          placeholder="5512345678"
          keyboardType="phone-pad"
          valor={telefono}
          onChange={setTelefono}
          error={errores.telefono}
        />
        <Campo
          label="Contraseña"
          campo="contrasena"
          placeholder="Mínimo 6 caracteres"
          esPassword
          verEstado={verPass}
          toggleVer={() => setVerPass(p => !p)}
          valor={contrasena}
          onChange={setContrasena}
          error={errores.contrasena}
        />
        <Campo
          label="Confirmar contraseña"
          campo="confirmar"
          placeholder="Repite tu contraseña"
          esPassword
          verEstado={verConfirm}
          toggleVer={() => setVerConfirm(p => !p)}
          valor={confirmar}
          onChange={setConfirmar}
          error={errores.confirmar}
        />

        <TouchableOpacity
          style={[styles.btnRegistrar, cargando && { opacity: 0.7 }]}
          onPress={registrar}
          disabled={cargando}
        >
          {cargando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnTexto}>Crear Cuenta</Text>
          }
        </TouchableOpacity>

        <View style={styles.loginLink}>
          <Text style={styles.loginTexto}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginEnlace}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f7f6f2' },
  content:      { paddingBottom: 40 },
  header:       { backgroundColor: '#01696f', alignItems: 'center',
                  paddingTop: 60, paddingBottom: 36 },
  logoCircle:   { width: 72, height: 72, borderRadius: 36,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoEmoji:    { fontSize: 36 },
  titulo:       { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitulo:    { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  form:         { padding: 20 },
  campo:        { marginBottom: 16 },
  label:        { fontSize: 13, fontWeight: '600', color: '#28251d', marginBottom: 6 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                  borderRadius: 10, borderWidth: 1, borderColor: '#d4d1ca' },
  inputError:   { borderColor: '#c62828' },
  input:        { flex: 1, padding: 13, fontSize: 15, color: '#28251d' },
  ojito:        { paddingHorizontal: 12 },
  errorTexto:   { fontSize: 12, color: '#c62828', marginTop: 4 },
  btnRegistrar: { backgroundColor: '#01696f', borderRadius: 10,
                  padding: 16, alignItems: 'center', marginTop: 8 },
  btnTexto:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink:    { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginTexto:   { fontSize: 14, color: '#7a7974' },
  loginEnlace:  { fontSize: 14, color: '#01696f', fontWeight: '600' },
});