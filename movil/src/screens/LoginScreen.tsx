import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  onIniciarSesion: (
    rol: 'cliente' | 'administrador',
    usuario: string,
    contraseña: string,
  ) => boolean;
  onCancelar: () => void;
};

export function LoginScreen({ onIniciarSesion, onCancelar }: Props) {
  const [rol, setRol] = useState<'cliente' | 'administrador'>('cliente');
  const [usuario, setUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error, setError] = useState('');

  const iniciarSesion = () => {
    if (!onIniciarSesion(rol, usuario.trim(), contraseña)) {
      setError(
        rol === 'administrador'
          ? 'Usuario o contraseña incorrectos.'
          : 'El teléfono debe tener 10 dígitos y coincidir con una reserva.',
      );
      return;
    }
    setError('');
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.card}>
        <View style={styles.roles}>
          <Pressable
            style={[styles.rol, rol === 'cliente' && styles.rolActivo]}
            onPress={() => {
              setRol('cliente');
              setError('');
            }}
          >
            <Text style={[styles.rolTexto, rol === 'cliente' && styles.rolTextoActivo]}>
              Soy cliente
            </Text>
          </Pressable>
          <Pressable
            style={[styles.rol, rol === 'administrador' && styles.rolActivo]}
            onPress={() => {
              setRol('administrador');
              setError('');
            }}
          >
            <Text
              style={[
                styles.rolTexto,
                rol === 'administrador' && styles.rolTextoActivo,
              ]}
            >
              Administrador
            </Text>
          </Pressable>
        </View>

        <Text style={styles.titulo}>
          {rol === 'cliente' ? 'Consulta tu cita' : 'Acceso administrativo'}
        </Text>
        <Text style={styles.subtitulo}>
          {rol === 'cliente'
            ? 'Ingresa el teléfono usado al reservar.'
            : 'Inicia sesión para administrar todas las citas.'}
        </Text>

        <Text style={styles.etiqueta}>
          {rol === 'cliente' ? 'Teléfono' : 'Usuario'}
        </Text>
        <TextInput
          value={usuario}
          onChangeText={(valor) =>
            setUsuario(
              rol === 'cliente'
                ? valor.replace(/\D/g, '').slice(0, 10)
                : valor,
            )
          }
          placeholder={rol === 'cliente' ? '0990000000' : 'Escribe tu usuario'}
          placeholderTextColor="#9a8d82"
          autoCapitalize="none"
          keyboardType={rol === 'cliente' ? 'phone-pad' : 'default'}
          style={styles.input}
        />

        {rol === 'administrador' ? (
          <>
            <Text style={styles.etiqueta}>Contraseña</Text>
            <TextInput
              value={contraseña}
              onChangeText={setContraseña}
              placeholder="Escribe tu contraseña"
              placeholderTextColor="#9a8d82"
              secureTextEntry
              style={styles.input}
            />
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
          onPress={iniciarSesion}
        >
          <Text style={styles.botonTexto}>Iniciar sesión</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.botonSecundario, pressed && styles.presionado]}
          onPress={onCancelar}
        >
          <Text style={styles.botonSecundarioTexto}>Volver al catálogo</Text>
        </Pressable>

        {rol === 'administrador' ? (
          <Text style={styles.demo}>
            Demo: usuario admin / contraseña aura2026
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { minHeight: 520, justifyContent: 'center' },
  roles: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  rol: {
    flex: 1,
    alignItems: 'center',
    borderColor: '#dccfc5',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
  },
  rolActivo: {
    backgroundColor: '#8a5d50',
    borderColor: '#8a5d50',
  },
  rolTexto: { color: '#75665f', fontSize: 13, fontWeight: '700' },
  rolTextoActivo: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },
  titulo: {
    color: '#5e4038',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitulo: {
    color: '#75665f',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
    marginTop: 8,
  },
  etiqueta: {
    color: '#5e4038',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 10,
  },
  input: {
    borderColor: '#dccfc5',
    borderRadius: 10,
    borderWidth: 1,
    color: '#46372f',
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 13,
  },
  error: {
    backgroundColor: '#fdecec',
    borderRadius: 8,
    color: '#a43e3e',
    marginTop: 12,
    padding: 10,
  },
  boton: {
    alignItems: 'center',
    backgroundColor: '#8a5d50',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 52,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  botonSecundario: {
    alignItems: 'center',
    borderColor: '#8a5d50',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  botonSecundarioTexto: {
    color: '#8a5d50',
    fontSize: 15,
    fontWeight: '700',
  },
  presionado: { opacity: 0.82 },
  demo: {
    color: '#9a8d82',
    fontSize: 12,
    marginTop: 14,
    textAlign: 'center',
  },
});
