// screens/AddExpenseScreen.jsx
import React, {  useState , useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Platform, Alert, KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme, Typography, Spacing, Radius, Shadow, CATEGORIES, getCategoryById } from '../theme';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/storage';
import { formatAmountFull } from '../utils/helpers';

export default function AddExpenseScreen({ navigation, route }) {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  const { addTransaction, updateTransaction, settings } = useApp();

  const editTxn = route.params?.transaction;

  const [type, setType]           = useState(editTxn ? editTxn.type : 'expense');
  const [amount, setAmount]       = useState(editTxn ? String(editTxn.amount) : '');
  const [title, setTitle]         = useState(editTxn ? editTxn.title : '');
  const [category, setCategory]   = useState(editTxn && editTxn.category !== 'salary' ? editTxn.category : 'food');
  const [date, setDate]           = useState(editTxn ? new Date(editTxn.date) : new Date());
  const [showDate, setShowDate]   = useState(false);
  const [saving, setSaving]       = useState(false);

  const selectedCat = getCategoryById(category);

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title or note');
      return;
    }

    setSaving(true);
    try {
      const txnData = {
        id: editTxn ? editTxn.id : generateId(),
        type,
        amount: parseFloat(amount),
        title: title.trim(),
        category: type === 'income' ? 'salary' : category,
        date: date.toISOString(),
        createdAt: editTxn ? editTxn.createdAt : new Date().toISOString(),
      };

      if (editTxn) {
        await updateTransaction(txnData);
      } else {
        await addTransaction(txnData);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editTxn ? 'Edit Transaction' : 'New Transaction'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]}
            onPress={() => { setType('expense'); setCategory('food'); }}
          >
            <MaterialIcons name="arrow-upward" size={16} color={type === 'expense' ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]}
            onPress={() => { setType('income'); setCategory('salary'); }}
          >
            <MaterialIcons name="arrow-downward" size={16} color={type === 'income' ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text>
          </TouchableOpacity>
        </View>

        {/* Amount Display */}
        <View style={styles.amountCard}>
          <Text style={styles.currencySymbol}>{settings.currency}</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            maxLength={12}
          />
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Title / Note</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="edit" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="What was this for?"
                placeholderTextColor={Colors.textMuted}
                maxLength={60}
              />
            </View>
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity style={styles.inputRow} onPress={() => setShowDate(true)}>
              <MaterialIcons name="event" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <Text style={styles.dateText}>
                {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Picker (only for expenses) */}
        {type === 'expense' && (
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
                    styles.catTileIcon,
                    { backgroundColor: cat.bg },
                    category === cat.id && { backgroundColor: cat.color }
                  ]}>
                    <MaterialIcons
                      name={cat.icon}
                      size={20}
                      color={category === cat.id ? '#fff' : cat.color}
                    />
                  </View>
                  <Text style={[
                    styles.catTileLabel,
                    category === cat.id && { color: Colors.textPrimary }
                  ]}>
                    {cat.label}
                  </Text>
                  {category === cat.id && (
                    <View style={[styles.catCheck, { backgroundColor: cat.color }]}>
                      <MaterialIcons name="check" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <MaterialIcons name="check" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Transaction'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(_, d) => { setShowDate(false); if (d) setDate(d); }}
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
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: Typography.bold, fontSize: 18, color: Colors.textPrimary },

  typeToggle: {
    flexDirection: 'row', marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: 4, marginBottom: Spacing.lg,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: Radius.md,
  },
  typeBtnExpense: { backgroundColor: Colors.accent },
  typeBtnIncome: { backgroundColor: Colors.income },
  typeText: { fontFamily: Typography.semiBold, fontSize: 14, color: Colors.textSecondary },
  typeTextActive: { color: '#fff' },

  amountCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: Spacing.base, marginBottom: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.cardBorder,
    ...Shadow.card,
  },
  currencySymbol: { fontFamily: Typography.mono, fontSize: 32, color: Colors.textSecondary, marginRight: 4 },
  amountInput: {
    fontFamily: Typography.mono, fontSize: 40, color: Colors.textPrimary,
    minWidth: 120, textAlign: 'left',
  },

  formCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  field: { marginBottom: Spacing.lg },
  fieldLabel: { fontFamily: Typography.medium, fontSize: 12, color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.divider,
  },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, fontFamily: Typography.regular, fontSize: 15, color: Colors.textPrimary },
  dateText: { fontFamily: Typography.regular, fontSize: 15, color: Colors.textPrimary },

  section: { marginHorizontal: Spacing.base, marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: Typography.semiBold, fontSize: 14, color: Colors.textPrimary, marginBottom: Spacing.md },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catTile: {
    width: '22%',
    alignItems: 'center', paddingVertical: 12,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.divider,
    position: 'relative',
  },
  catTileActive: { borderColor: Colors.accent },
  catTileIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  catTileLabel: { fontFamily: Typography.medium, fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  catCheck: {
    position: 'absolute', top: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: Spacing.base, marginTop: Spacing.sm,
    backgroundColor: Colors.accent, borderRadius: Radius.xl, paddingVertical: 16,
    ...Shadow.accent,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: Typography.bold, fontSize: 16, color: '#fff' },
});
