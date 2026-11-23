import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const MAX_PRICE = 2147483647;

const DEFAULT_FILTERS = {
  category: '',
  minPrice: '',
  maxPrice: '',
  condition: '',
  sort: 'recent',
};

const CONDITION_OPTIONS = [
  { value: '', label: 'Cualquiera' },
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'usado', label: 'Usado' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
];

function ChoiceChip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.selectedChip]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ChoiceGroup({ options, value, onChange }) {
  return (
    <View style={styles.chipGroup}>
      {options.map((option) => (
        <ChoiceChip
          key={option.value || 'all'}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

export default function CatalogFilterSheet({
  visible,
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
  filters,
  onClose,
  onApply,
}) {
  const [draft, setDraft] = useState(filters);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
      setValidationError(null);
    }
  }, [filters, visible]);

  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setValidationError(null);
  };

  const applyFilters = () => {
    const minText = draft.minPrice.trim();
    const maxText = draft.maxPrice.trim();
    const isValidPrice = (value) =>
      value === '' ||
      (/^\d+$/.test(value) && Number(value) <= MAX_PRICE);

    if (!isValidPrice(minText) || !isValidPrice(maxText)) {
      setValidationError('Ingresa precios enteros mayores o iguales a 0.');
      return;
    }

    if (minText !== '' && maxText !== '' && Number(minText) > Number(maxText)) {
      setValidationError('El precio mínimo no puede superar al máximo.');
      return;
    }

    onApply({ ...draft, minPrice: minText, maxPrice: maxText });
  };

  const resetFilters = () => {
    setDraft({ ...DEFAULT_FILTERS });
    setValidationError(null);
  };

  const categoryOptions = [
    { value: '', label: 'Todas' },
    ...categories.map((category) => ({
      value: category.slug,
      label: category.name,
    })),
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Cerrar filtros"
        />
        <KeyboardAvoidingView
          style={styles.sheetWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Filtros</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Cerrar filtros"
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionTitle}>Categoría</Text>
              {categoriesLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : categoriesError ? (
                <View style={styles.categoryError}>
                  <Text style={styles.errorText}>{categoriesError}</Text>
                  <TouchableOpacity
                    onPress={onRetryCategories}
                    accessibilityRole="button"
                  >
                    <Text style={styles.retryText}>Reintentar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ChoiceGroup
                  options={categoryOptions}
                  value={draft.category}
                  onChange={(value) => updateDraft('category', value)}
                />
              )}

              <Text style={styles.sectionTitle}>Rango de precio (CLP)</Text>
              <View style={styles.priceFields}>
                <View style={styles.priceField}>
                  <Text style={styles.fieldLabel}>Mínimo</Text>
                  <TextInput
                    style={styles.input}
                    value={draft.minPrice}
                    onChangeText={(value) => updateDraft('minPrice', value)}
                    keyboardType="number-pad"
                    placeholder="Sin mínimo"
                    placeholderTextColor={colors.inactive}
                    accessibilityLabel="Precio mínimo"
                  />
                </View>
                <View style={styles.priceField}>
                  <Text style={styles.fieldLabel}>Máximo</Text>
                  <TextInput
                    style={styles.input}
                    value={draft.maxPrice}
                    onChangeText={(value) => updateDraft('maxPrice', value)}
                    keyboardType="number-pad"
                    placeholder="Sin máximo"
                    placeholderTextColor={colors.inactive}
                    accessibilityLabel="Precio máximo"
                  />
                </View>
              </View>

              <Text style={styles.sectionTitle}>Condición</Text>
              <ChoiceGroup
                options={CONDITION_OPTIONS}
                value={draft.condition}
                onChange={(value) => updateDraft('condition', value)}
              />

              <Text style={styles.sectionTitle}>Ordenar por</Text>
              <ChoiceGroup
                options={SORT_OPTIONS}
                value={draft.sort}
                onChange={(value) => updateDraft('sort', value)}
              />

              {validationError ? (
                <Text style={styles.validationError}>{validationError}</Text>
              ) : null}
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
                accessibilityRole="button"
              >
                <Text style={styles.resetButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
                accessibilityRole="button"
              >
                <Text style={styles.applyButtonText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetWrapper: {
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scroll: {
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 10,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedChip: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
  },
  selectedChipText: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  priceFields: {
    flexDirection: 'row',
    gap: 12,
  },
  priceField: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: 6,
    color: colors.textMuted,
    fontSize: 12,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.text,
    backgroundColor: colors.background,
  },
  categoryError: {
    gap: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '700',
  },
  validationError: {
    marginTop: 16,
    color: colors.danger,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  applyButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
});
