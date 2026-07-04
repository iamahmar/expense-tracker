// screens/CreateCategoryBudgetScreen.jsx — Create / edit a category-level budget
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Platform, Alert, KeyboardAvoidingView, Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme, Typography, Spacing, Radius, Shadow, CATEGORIES } from '../theme';
import { useApp } from '../context/AppContext';
import { useLayers } from '../context/LayerContext';
import { useCategoryBudgets } from '../context/CategoryBudgetContext';
import { generateId, CURRENCIES } from '../utils/storage';
import { PERIODS, getPeriodMeta } from '../utils/budgetPeriods';

export default function CreateCategoryBudgetScreen({ navigation, route }) {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  const { settings } = useApp();
  const { activeLayer } = useLayers();
  const { createBudget, editBudget, removeBudget } = useCategoryBudgets();

  const editBudgetData = route.params?.budget;

  const layerCurrency = activeLayer?.currency ?? settings.currency;
  const layerCurrencyCode = activeLayer?.currencyCode ?? settings.currencyCode;

  const [category, setCategory]   = useState(editBudgetData?.category ?? route.params?.presetCategory ?? 'food');
  const [amount, setAmount]       = useState(editBudgetData ? String(editBudgetData.amount) : '');
  const [period, setPeriod]       = useState(editBudgetData?.period ?? 'monthly');
  const [recurring, setRecurring] = useState(editBudgetData?.recurring ?? true);
  const [currencyCode, setCurrencyCode] = useState(editBudgetData?.currencyCode ?? layerCurrencyCode);
  const [anchorDate, setAnchorDate] = useState(
    editBudgetData?.anchorDate ? new Date(editBudgetData.anchorDate) : new Date()
  );
  const [endDate, setEndDate] = useState(
    editBudgetData?.endDate ? new Date(editBudgetData.endDate) : null
  );
  const [showAnchor, setShowAnchor] = useState(false);
  const [showEnd, setShowEnd]       = useState(false);
  const [saving, setSaving]         = useState(false);

  const currency = CURRENCIES.find(c => c.code === currencyCode)?.symbol ?? layerCurrency;
  const periodMeta = getPeriodMeta(period);
  const isCustom = period === 'custom';
  const isLifetime = period === 'lifetime';
  const showRecurring = !isCustom && !isLifetime;

  const selectPeriod = (key) => {
    setPeriod(key);
    const meta = getPeriodMeta(key);
    setRecurring(meta.recurringDefault);
    if (key === 'custom' && !endDate) {
      const e = new Date(anchorDate);
      e.setMonth(e.getMonth() + 1);
      setEndDate(e);
    }
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount');
      return;
    }
    if (isCustom) {
      if (!endDate) { Alert.alert('Missing End Date', 'Custom budgets need an end date'); return; }
      if (endDate <= anchorDate) { Alert.alert('Invalid Range', 'End date must be after the start date'); return; }
    }

    setSaving(true);
    try {
      const data = {
        id: editBudgetData ? editBudgetData.id : generateId('cbud'),
        layerId: editBudgetData ? editBudgetData.layerId : (activeLayer?.id ?? 'layer_default'),
        category,
        amount: amt,
        currency,
        currencyCode,
        period,
        recurring: showRecurring ? recurring : false,
        anchorDate: anchorDate.toISOString(),
        endDate: isCustom && endDate ? endDate.toISOString() : null,
        createdAt: editBudgetData ? editBudgetData.createdAt : new Date().toISOString(),
      };
      if (editBudgetData) await editBudget(data);
      else await createBudget(data);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Budget', 'Remove this category budget? Your transactions are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await removeBudget(editBudgetData.id); navigation.goBack(); },
      },
    ]);
  };

  const fmtDate = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editBudgetData ? 'Edit Budget' : 'New Category Budget'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.currencySymbol}>{currency}</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            maxLength={12}
          />
          <Text style={styles.periodSuffix}>{periodMeta.short}</Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.filter(c => c.id !== 'salary').map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catTile, category === cat.id && styles.catTileActive]}
                onPress={() => setCategory(cat.id)}
              >
                <View style={[
                  styles.catTileIcon, { backgroundColor: cat.bg },
                  category === cat.id && { backgroundColor: cat.color },
                ]}>
                  <MaterialIcons name={cat.icon} size={20} color={category === cat.id ? '#fff' : cat.color} />
                </View>
                <Text style={[styles.catTileLabel, category === cat.id && { color: Colors.textPrimary }]}>
                  {cat.shortLabel || cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Period</Text>
          <View style={styles.periodGrid}>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodChip, period === p.key && styles.periodChipActive]}
                onPress={() => selectPeriod(p.key)}
              >
                <MaterialIcons name={p.icon} size={16} color={period === p.key ? '#fff' : Colors.textSecondary} />
                <Text style={[styles.periodChipTxt, period === p.key && { color: '#fff' }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Config card */}
        <View style={styles.formCard}>
          {/* Currency */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Currency</Text>
            <View style={styles.currencyRow}>
              {CURRENCIES.map(c => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.curChip, currencyCode === c.code && styles.curChipActive]}
                  onPress={() => setCurrencyCode(c.code)}
                >
                  <Text style={[styles.curChipTxt, currencyCode === c.code && { color: '#fff' }]}>
                    {c.symbol} {c.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recurring toggle */}
          {showRecurring && (
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Recurring</Text>
                <Text style={styles.switchHint}>
                  {recurring ? 'Resets automatically each period' : 'Runs once for a single period'}
                </Text>
              </View>
              <Switch
                value={recurring}
                onValueChange={setRecurring}
                trackColor={{ false: Colors.dividerStrong, true: Colors.accentDim }}
                thumbColor={recurring ? Colors.accent : Colors.textMuted}
              />
            </View>
          )}

          {/* Start date */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{isCustom ? 'Start Date' : 'Starts On'}</Text>
            <TouchableOpacity style={styles.inputRow} onPress={() => setShowAnchor(true)}>
              <MaterialIcons name="event" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
              <Text style={styles.dateText}>{fmtDate(anchorDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* End date (custom only) */}
          {isCustom && (
            <View style={[styles.field, { marginBottom: 0 }]}>
              <Text style={styles.fieldLabel}>End Date</Text>
              <TouchableOpacity style={styles.inputRow} onPress={() => setShowEnd(true)}>
                <MaterialIcons name="event-available" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <Text style={styles.dateText}>{endDate ? fmtDate(endDate) : 'Pick a date'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLifetime && (
            <View style={styles.infoNote}>
              <MaterialIcons name="all-inclusive" size={16} color={Colors.info} />
              <Text style={styles.infoNoteTxt}>Runs indefinitely until you change or delete it.</Text>
            </View>
          )}
        </View>

        {/* Save */}
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <MaterialIcons name="check" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Budget'}</Text>
        </TouchableOpacity>

        {editBudgetData && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <MaterialIcons name="delete-outline" size={18} color={Colors.danger} />
            <Text style={styles.deleteBtnText}>Delete Budget</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {showAnchor && (
        <DateTimePicker
          value={anchorDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant={settings.theme === 'light' ? 'light' : 'dark'}
          onChange={(_, d) => { setShowAnchor(false); if (d) setAnchorDate(d); }}
        />
      )}
      {showEnd && (
        <DateTimePicker
          value={endDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant={settings.theme === 'light' ? 'light' : 'dark'}
          minimumDate={anchorDate}
          onChange={(_, d) => { setShowEnd(false); if (d) setEndDate(d); }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const get_styles = (Colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: 120 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: Spacing.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Typography.bold, fontSize: 18, color: Colors.textPrimary },

  amountCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: Spacing.base, marginBottom: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.card,
  },
  currencySymbol: { fontFamily: Typography.mono, fontSize: 30, color: Colors.textSecondary, marginRight: 4 },
  amountInput: { fontFamily: Typography.mono, fontSize: 40, color: Colors.textPrimary, minWidth: 80, textAlign: 'left' },
  periodSuffix: { fontFamily: Typography.medium, fontSize: 16, color: Colors.textMuted, marginLeft: 6 },

  section: { marginHorizontal: Spacing.base, marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: Typography.semiBold, fontSize: 14, color: Colors.textPrimary, marginBottom: Spacing.md },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catTile: {
    width: '22%', alignItems: 'center', paddingVertical: 12,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.divider,
  },
  catTileActive: { borderColor: Colors.accent },
  catTileIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  catTileLabel: { fontFamily: Typography.medium, fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },

  periodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  periodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider,
  },
  periodChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  periodChipTxt: { fontFamily: Typography.medium, fontSize: 13, color: Colors.textSecondary },

  formCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  field: { marginBottom: Spacing.lg },
  fieldLabel: { fontFamily: Typography.medium, fontSize: 12, color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.divider,
  },
  dateText: { fontFamily: Typography.regular, fontSize: 15, color: Colors.textPrimary },

  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  curChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.divider },
  curChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  curChipTxt: { fontFamily: Typography.medium, fontSize: 13, color: Colors.textSecondary },

  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  switchLabel: { fontFamily: Typography.semiBold, fontSize: 14, color: Colors.textPrimary },
  switchHint: { fontFamily: Typography.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  infoNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.infoLight, borderRadius: Radius.md, padding: 12 },
  infoNoteTxt: { flex: 1, fontFamily: Typography.regular, fontSize: 12, color: Colors.textSecondary },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing.base, marginTop: Spacing.sm,
    backgroundColor: Colors.accent, borderRadius: Radius.xl, paddingVertical: 16, ...Shadow.accent,
  },
  saveBtnText: { fontFamily: Typography.bold, fontSize: 16, color: '#fff' },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  deleteBtnText: { fontFamily: Typography.medium, fontSize: 14, color: Colors.danger },
});
