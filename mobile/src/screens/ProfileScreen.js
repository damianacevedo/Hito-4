import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import AppButton from '../components/AppButton';
import LoadingView from '../components/LoadingView';
import ErrorView from '../components/ErrorView';
import colors from '../theme/colors';

const ROLE_LABELS = {
  buyer: 'Comprador',
  seller: 'Vendedor',
  admin: 'Administrador',
};

const EMPTY_TEXT = 'Sin especificar';

// Límites iguales a UpdateUserDto del backend.
const MAX_LENGTH = { name: 100, career: 100, campus: 100, phone: 30 };

function displayValue(value) {
  const text = typeof value === 'string' ? value.trim() : value;
  return text ? String(text) : EMPTY_TEXT;
}

function profileToForm(profile) {
  return {
    name: profile?.name ?? '',
    career: profile?.career ?? '',
    campus: profile?.campus ?? '',
    phone: profile?.phone ?? '',
  };
}

// Mismas reglas y mensajes que UpdateUserDto (se valida el texto ya recortado, que es lo que se envía).
function validateForm(form) {
  const errors = {};
  const name = form.name.trim();

  if (!name) {
    errors.name = 'El nombre no puede estar vacío';
  } else if (name.length > MAX_LENGTH.name) {
    errors.name = 'El nombre no puede superar los 100 caracteres';
  }
  if (form.career.trim().length > MAX_LENGTH.career) {
    errors.career = 'La carrera no puede superar los 100 caracteres';
  }
  if (form.campus.trim().length > MAX_LENGTH.campus) {
    errors.campus = 'El campus no puede superar los 100 caracteres';
  }
  if (form.phone.trim().length > MAX_LENGTH.phone) {
    errors.phone = 'El teléfono no puede superar los 30 caracteres';
  }

  return errors;
}

function getErrorMessage(err, fallback) {
  if (err?.status === 0) return 'No se pudo conectar con el servidor';
  return err?.message || fallback;
}

function InfoRow({ icon, label, value }) {
  const isEmpty = value === EMPTY_TEXT;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.primary} style={styles.infoIcon} />
      <View style={styles.infoTexts}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, isEmpty && styles.infoValueEmpty]}>{value}</Text>
      </View>
    </View>
  );
}

function FormField({ label, error, style, ...inputProps }) {
  // Borde rojo con foco, como .form-control:focus de la web.
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.input, focused && styles.inputFocused, error && styles.inputError, style]}
        placeholderTextColor={colors.inactive}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...inputProps}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function ProfileScreen() {
  const { logout, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profileToForm(null));
  const [formErrors, setFormErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  // GET /users/me. También pone al día el usuario de la sesión (ej. si pasó de comprador a vendedor).
  const loadProfile = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setLoadError(null);

      try {
        const data = await userService.getMe();
        setProfile(data);
        updateUser(data);
      } catch (err) {
        setLoadError(getErrorMessage(err, 'No se pudo cargar tu perfil.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [updateUser]
  );

  useEffect(() => {
    loadProfile(false);
  }, [loadProfile]);

  const handleStartEditing = () => {
    setForm(profileToForm(profile));
    setFormErrors({});
    setSaveError(null);
    setEditing(true);
  };

  const handleCancelEditing = () => {
    setEditing(false);
    setFormErrors({});
    setSaveError(null);
  };

  const handleChange = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    if (saveError) setSaveError(null);
  };

  const handleSave = async () => {
    if (saving) return;

    const errors = validateForm(form);
    setFormErrors(errors);
    setSaveError(null);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const updated = await userService.updateMe(form);
      setProfile(updated);
      await updateUser(updated);
      setEditing(false);
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.');
    } catch (err) {
      setSaveError(getErrorMessage(err, 'No se pudo actualizar el perfil.'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading && !profile) {
    return <LoadingView message="Cargando tu perfil..." />;
  }

  if (loadError && !profile) {
    return <ErrorView message={loadError} onRetry={() => loadProfile(false)} />;
  }

  const roleLabel = ROLE_LABELS[profile?.role] || displayValue(profile?.role);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          editing ? undefined : (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadProfile(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          )
        }
      >
        {/* Error al recargar cuando ya hay datos en pantalla */}
        {loadError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : null}

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={44} color={colors.primary} />
          </View>
          <Text style={styles.name}>{displayValue(profile?.name)}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
        </View>

        {editing ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Editar perfil</Text>

            <FormField
              label="Nombre *"
              value={form.name}
              onChangeText={handleChange('name')}
              error={formErrors.name}
              maxLength={MAX_LENGTH.name}
              placeholder="Tu nombre completo"
              autoCapitalize="words"
              editable={!saving}
            />
            <FormField
              label="Carrera"
              value={form.career}
              onChangeText={handleChange('career')}
              error={formErrors.career}
              maxLength={MAX_LENGTH.career}
              placeholder="Ej. Ingeniería Civil Informática"
              editable={!saving}
            />
            <FormField
              label="Campus"
              value={form.campus}
              onChangeText={handleChange('campus')}
              error={formErrors.campus}
              maxLength={MAX_LENGTH.campus}
              placeholder="Ej. República"
              editable={!saving}
            />
            <FormField
              label="Teléfono"
              value={form.phone}
              onChangeText={handleChange('phone')}
              error={formErrors.phone}
              maxLength={MAX_LENGTH.phone}
              placeholder="Ej. +56912345678"
              keyboardType="phone-pad"
              editable={!saving}
            />
            <Text style={styles.hint}>
              Deja carrera, campus o teléfono en blanco para borrarlos. El correo y el rol no se
              pueden modificar.
            </Text>

            {saveError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{saveError}</Text>
              </View>
            ) : null}

            <View style={styles.formButtons}>
              <AppButton
                title="Cancelar"
                variant="outline"
                onPress={handleCancelEditing}
                disabled={saving}
                style={styles.rowButton}
              />
              <AppButton
                title="Guardar"
                loading={saving}
                onPress={handleSave}
                style={styles.rowButton}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <InfoRow icon="person-outline" label="Nombre" value={displayValue(profile?.name)} />
              <InfoRow icon="mail-outline" label="Correo" value={displayValue(profile?.email)} />
              <InfoRow icon="school-outline" label="Carrera" value={displayValue(profile?.career)} />
              <InfoRow icon="location-outline" label="Campus" value={displayValue(profile?.campus)} />
              <InfoRow icon="call-outline" label="Teléfono" value={displayValue(profile?.phone)} />
              <InfoRow icon="ribbon-outline" label="Rol" value={roleLabel} />
            </View>

            <AppButton
              title="Editar perfil"
              icon="create-outline"
              onPress={handleStartEditing}
              style={styles.fullButton}
            />
          </>
        )}

        <AppButton
          title="Cerrar sesión"
          icon="log-out-outline"
          variant="outline"
          onPress={handleLogout}
          disabled={saving}
          style={styles.fullButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  name: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  // Como .btn-soft-primary de la web: fondo rojo suave y texto rojo.
  roleBadge: {
    marginTop: 8,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  // Como .filter-card de la web: blanca, borde gris y sombra suave.
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  infoValueEmpty: {
    color: colors.inactive,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  formField: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
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
  fieldError: {
    marginTop: 4,
    fontSize: 13,
    color: colors.danger,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginBottom: 14,
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
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  rowButton: {
    flex: 1,
  },
  fullButton: {
    marginBottom: 12,
  },
});
