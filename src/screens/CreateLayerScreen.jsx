// screens/CreateLayerScreen.jsx — Create or edit a wallet ("layer")
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Platform, Alert, KeyboardAvoidingView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme, Typography, Spacing, Radius, Shadow } from '../theme';
import { useApp } from '../context/AppContext';
import { useLayers } from '../context/LayerContext';
import { generateLayerId, LAYER_ICONS, LAYER_COLORS, CURRENCIES } from '../utils/storage';

export default function CreateLayerScreen({ navigation, route }) {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  const { settings } = useApp();
  const { createLayer, editLayer } = useLayers();

  const editingLayer = route.params?.layer;

  const [name, setName] = useState(editingLayer?.name ?? '');
  const [icon, setIcon] = useState(editingLayer?.icon ?? LAYER_ICONS[0]);
  const [color, setColor] = useState(editingLayer?.color ?? LAYER_COLORS[0]);
  const [budget, setBudget] = useState(String(editingLayer?.monthlyBudget ?? settings.monthlyBudget));
  const [currency, setCurrency] = useState({
    symbol: editingLayer?.currency ?? settings.currency,
    code: editingLayer?.currencyCode ?? settings.currencyCode,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a wallet name');
      return;
    }
    const budgetVal = parseFloat(budget);
    if (isNaN(budgetVal) || budgetVal <= 0) {
      Alert.alert('Invalid Budget', 'Enter a positive number');
      return;
    }

    setSaving(true);
    try {
      const layerData = {
        id: editingLayer ? editingLayer.id : generateLayerId(),
        name: name.trim(),
        icon,
        color,
        monthlyBudget: budgetVal,
        currency: currency.symbol,
        currencyCode: currency.code,
        createdAt: editingLayer ? editingLayer.createdAt : new Date().toISOString(),
      };

      if (editingLayer) {
        await editLayer(layerData);
      } else {
        await createLayer(layerData);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editingLayer ? 'Edit Wallet' : 'New Wallet'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Preview */}
        <View style={styles.previewCard}>
          <View style={[styles.previewIcon, { backgroundColor: color + '22' }]}>
            <MaterialIcons name={icon} size={28} color={color} />
          </View>
          <Text style={styles.previewName}>{name || 'Wallet Name'}</Text>
        </View>

        {/* Name */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Name</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="edit" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Business, Travel, Family"
              placeholderTextColor={Colors.textMuted}
              maxLength={30}
            />
          </View>
        </View>

        {/* Icon Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icon</Text>
          <View style={styles.grid}>
            {LAYER_ICONS.map(ic => (
              <TouchableOpacity
                key={ic}
                style={[styles.swatch, icon === ic && { borderColor: color, backgroundColor: color + '22' }]}
                onPress={() => setIcon(ic)}
              >
                <MaterialIcons name={ic} size={20} color={icon === ic ? color : Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.grid}>
            {LAYER_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchActive]}
                onPress={() => setColor(c)}
              >
                {color === c && <MaterialIcons name="check" size={16} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Monthly Budget</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currSymbol}>{currency.symbol}</Text>
            <TextInput
              style={styles.textInput}
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              maxLength={10}
            />
          </View>
        </View>

        {/* Currency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.map(curr => (
              <TouchableOpacity
                key={curr.code}
                style={[styles.currencyChip, currency.code === curr.code && styles.currencyChipActive]}
                onPress={() => setCurrency({ symbol: curr.symbol, code: curr.code })}
              >
                <Text style={[styles.currencyChipText, currency.code === curr.code && { color: Colors.accent }]}>
                  {curr.symbol} {curr.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled, { backgroundColor: color }]}
          onPress={handleSave}
          disabled={saving}
        >
          <MaterialIcons name="check" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : editingLayer ? 'Save Changes' : 'Create Wallet'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const get_styles = (Colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: 120 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 24 : 24,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: Typography.bold, fontSize: 18, color: Colors.textPrimary },

  previewCard: {
    alignItems: 'center', marginHorizontal: Spacing.base, marginBottom: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.cardBorder,
    ...Shadow.card,
  },
  previewIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  previewName: { fontFamily: Typography.semiBold, fontSize: 16, color: Colors.textPrimary },

  formCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  fieldLabel: { fontFamily: Typography.medium, fontSize: 12, color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.divider,
  },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, fontFamily: Typography.regular, fontSize: 15, color: Colors.textPrimary },
  currSymbol: { fontFamily: Typography.mono, fontSize: 16, color: Colors.textSecondary, marginRight: 8 },

  section: { marginHorizontal: Spacing.base, marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: Typography.semiBold, fontSize: 14, color: Colors.textPrimary, marginBottom: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider,
  },
  colorSwatch: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorSwatchActive: { borderColor: Colors.textPrimary },

  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider,
  },
  currencyChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accentMuted },
  currencyChipText: { fontFamily: Typography.medium, fontSize: 13, color: Colors.textSecondary },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: Spacing.base, marginTop: Spacing.sm,
    borderRadius: Radius.xl, paddingVertical: 16,
    ...Shadow.accent,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: Typography.bold, fontSize: 16, color: '#fff' },
});
