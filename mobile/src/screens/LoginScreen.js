import React, { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AppButton from '../components/AppButton';
import colors from '../theme/colors';

const logo = require('../../assets/logo_marketplace_unab.png');

// Mismo criterio básico que @IsEmail del backend: texto@texto.dominio, sin espacios.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida antes de enviar. Devuelve un objeto con el error de cada campo (vacío si todo está bien).
function validate(email, password) {
  const errors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = 'El correo es obligatorio';
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = 'El correo no tiene un formato válido';
  }

  if (!password) {
    errors.password = 'La contraseña es obligatoria';
  }

  return errors;
}

// Traduce el error de api.js a un mensaje para el usuario.
function getLoginErrorMessage(err) {
  if (err?.status === 401) return 'Correo o contraseña incorrectos';
  if (err?.status === 0) return 'No se pudo conectar con el servidor';
  return err?.message || 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

export default function LoginScreen() {
  const { login } = useAuth();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Campo con foco, para marcar su borde en rojo (como .form-control:focus de la web).
  const [focusedField, setFocusedField] = useState(null);

  const handleEmailChange = (value) => {
    setEmail(value);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
    if (apiError) setApiError(null);
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
    if (apiError) setApiError(null);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const errors = validate(email, password);
    setFieldErrors(errors);
    setApiError(null);

    if (errors.email) {
      emailRef.current?.focus();
      return;
    }
    if (errors.password) {
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      // Si sale bien, AppNavigator muestra las pestañas automáticamente.
    } catch (err) {
      setApiError(getLoginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Borde del campo: rojo si tiene error o foco; gris en otro caso.
  const fieldStyle = (field) => [
    focusedField === field && styles.inputFocused,
    fieldErrors[field] && styles.inputError,
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Image
              source={logo}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Marketplace UNAB"
            />

            <Text style={styles.title}>Iniciar sesión</Text>
            <Text style={styles.subtitle}>Ingresa con tu correo y contraseña.</Text>

            {/* Error de la API, arriba del formulario como el alert de la web */}
            {apiError ? (
              <View style={styles.errorBox}>
                <Ionicons name="warning" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{apiError}</Text>
              </View>
            ) : null}

            {/* Correo */}
            <Text style={styles.label}>Correo</Text>
            <TextInput
              ref={emailRef}
              style={[styles.input, ...fieldStyle('email')]}
              value={email}
              onChangeText={handleEmailChange}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="nombre@unab.cl"
              placeholderTextColor={colors.inactive}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!submitting}
            />
            {fieldErrors.email ? (
              <Text style={styles.fieldError}>{fieldErrors.email}</Text>
            ) : null}

            {/* Contraseña con botón para mostrar u ocultar */}
            <Text style={[styles.label, styles.labelSpacing]}>Contraseña</Text>
            <View style={[styles.passwordWrapper, ...fieldStyle('password')]}>
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                value={password}
                onChangeText={handlePasswordChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Tu contraseña"
                placeholderTextColor={colors.inactive}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                editable={!submitting}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            ) : null}

            <AppButton
              title="Iniciar sesión"
              loadingTitle="Ingresando..."
              loading={submitting}
              onPress={handleSubmit}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  logo: {
    width: '100%',
    maxWidth: 280,
    aspectRatio: 2172 / 724, // proporción del PNG
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 20,
    fontSize: 14,
    color: colors.textMuted,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  labelSpacing: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fieldError: {
    marginTop: 4,
    fontSize: 13,
    color: colors.danger,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
  },
  submitButton: {
    marginTop: 24,
  },
});
