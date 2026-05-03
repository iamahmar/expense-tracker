// screens/SettingsScreen.jsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ScrollView, Platform, Modal, FlatList, Switch, Image
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getThemeColors, Typography, Spacing, Radius, Shadow } from '../theme';
import { useApp } from '../context/AppContext';
import { CURRENCIES } from '../utils/storage';
import { formatAmount } from '../utils/helpers';

export default function SettingsScreen() {
  const { settings, updateSettings, clearData, transactions } = useApp();
  const Colors = getThemeColors(settings.theme);
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const [budget, setBudget] = useState(String(settings.monthlyBudget));
  const [editingBudget, setEditingBudget] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);

  const totalExpense = transactions
    .filter(t => {
      const d = new Date(t.date);
      const now = new Date();
      return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  const budgetPct = (totalExpense / settings.monthlyBudget) * 100;
  const exceeded = totalExpense > settings.monthlyBudget;

  const saveBudget = async () => {
    const val = parseFloat(budget);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Budget', 'Enter a positive number');
      return;
    }
    await updateSettings({ monthlyBudget: val });
    setEditingBudget(false);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all transactions and reset settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear Everything', style: 'destructive', onPress: () => clearData() },
      ]
    );
  };

  const handleCurrencySelect = async (curr) => {
    await updateSettings({ currency: curr.symbol, currencyCode: curr.code });
    setShowCurrency(false);
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Budget Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="account-balance-wallet" size={18} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Monthly Budget</Text>
        </View>

        <View style={styles.budgetDisplay}>
          {editingBudget ? (
            <View style={styles.budgetEditRow}>
              <Text style={styles.currSymbol}>{settings.currency}</Text>
              <TextInput
                style={styles.budgetInput}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                autoFocus
                maxLength={10}
              />
              <TouchableOpacity style={styles.budgetSaveBtn} onPress={saveBudget}>
                <MaterialIcons name="check" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.budgetCancelBtn} onPress={() => { setBudget(String(settings.monthlyBudget)); setEditingBudget(false); }}>
                <MaterialIcons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.budgetRow} onPress={() => setEditingBudget(true)}>
              <Text style={styles.budgetAmount}>
                {formatAmount(settings.monthlyBudget, settings.currency)}
              </Text>
              <MaterialIcons name="edit" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Budget Status */}
        <View style={[styles.budgetStatus, exceeded ? styles.budgetStatusWarn : styles.budgetStatusOk]}>
          <MaterialIcons
            name={exceeded ? 'warning' : 'check-circle'}
            size={16}
            color={exceeded ? Colors.warning : Colors.success}
          />
          <Text style={[styles.budgetStatusText, { color: exceeded ? Colors.warning : Colors.success }]}>
            {exceeded
              ? `Over by ${formatAmount(totalExpense - settings.monthlyBudget, settings.currency)}`
              : `${Math.round(budgetPct)}% used — ${formatAmount(settings.monthlyBudget - totalExpense, settings.currency)} remaining`
            }
          </Text>
        </View>

        <View style={styles.budgetBar}>
          <View style={[
            styles.budgetBarFill,
            { width: `${Math.min(budgetPct, 100)}%`, backgroundColor: exceeded ? Colors.warning : Colors.accent }
          ]} />
        </View>
      </View>

      {/* Currency Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="attach-money" size={18} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Currency</Text>
        </View>

        <TouchableOpacity style={styles.currencyRow} onPress={() => setShowCurrency(true)}>
          <View style={styles.currencyLeft}>
            <Text style={styles.currencySymbolBig}>{settings.currency}</Text>
            <View>
              <Text style={styles.currencyCode}>{settings.currencyCode}</Text>
              <Text style={styles.currencyName}>
                {CURRENCIES.find(c => c.code === settings.currencyCode)?.label || 'Currency'}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Appearance Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="palette" size={18} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Appearance</Text>
        </View>
        <View style={styles.appearanceRow}>
          <Text style={styles.appearanceLabel}>Dark Theme</Text>
          <Switch
            value={settings.theme !== 'light'}
            onValueChange={(val) => updateSettings({ theme: val ? 'dark' : 'light' })}
            trackColor={{ false: Colors.textMuted, true: Colors.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="bar-chart" size={18} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Data Summary</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{transactions.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {new Set(transactions.map(t => `${new Date(t.date).getMonth()}-${new Date(t.date).getFullYear()}`)).size}
            </Text>
            <Text style={styles.statLabel}>Months</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.accent }]}>
              {formatAmount(totalExpense, settings.currency)}
            </Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.sectionCard}>
        <View style={styles.aboutHeaderWrap}>
          <Image source={require('../../assets/icon.png')} style={styles.aboutLogo} />
          <Text style={styles.aboutAppName}>Expense Tracker</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutKey}>App</Text>
          <Text style={styles.aboutVal}>Expense Tracker</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutKey}>Version</Text>
          <Text style={styles.aboutVal}>1.0.0</Text>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={[styles.sectionCard, styles.dangerCard]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="delete-forever" size={18} color={Colors.danger} />
          <Text style={[styles.sectionTitle, { color: Colors.danger }]}>Danger Zone</Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearData}>
          <MaterialIcons name="warning" size={18} color={Colors.danger} />
          <Text style={styles.clearBtnText}>Clear All Data</Text>
        </TouchableOpacity>
        <Text style={styles.clearWarning}>
          This will permanently delete all transactions and cannot be undone.
        </Text>
      </View>

      <View style={{ height: 40 }} />

      {/* Currency Modal */}
      <Modal visible={showCurrency} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Currency</Text>
            {CURRENCIES.map(curr => (
              <TouchableOpacity
                key={curr.code}
                style={[styles.currencyOption, settings.currencyCode === curr.code && styles.currencyOptionActive]}
                onPress={() => handleCurrencySelect(curr)}
              >
                <Text style={styles.currencyOptionSymbol}>{curr.symbol}</Text>
                <View>
                  <Text style={styles.currencyOptionCode}>{curr.code}</Text>
                  <Text style={styles.currencyOptionName}>{curr.label}</Text>
                </View>
                {settings.currencyCode === curr.code && (
                  <MaterialIcons name="check-circle" size={20} color={Colors.accent} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowCurrency(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: 120 },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontFamily: Typography.bold, fontSize: 26, color: Colors.textPrimary },

  sectionCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  dangerCard: { borderColor: Colors.dangerLight },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  sectionTitle: { fontFamily: Typography.semiBold, fontSize: 15, color: Colors.textPrimary },

  budgetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  budgetAmount: { fontFamily: Typography.mono, fontSize: 28, color: Colors.textPrimary },
  budgetEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currSymbol: { fontFamily: Typography.mono, fontSize: 24, color: Colors.textSecondary },
  budgetInput: {
    flex: 1, fontFamily: Typography.mono, fontSize: 28, color: Colors.textPrimary,
    borderBottomWidth: 2, borderBottomColor: Colors.accent, paddingBottom: 4,
  },
  budgetSaveBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  budgetCancelBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  budgetDisplay: { marginBottom: Spacing.md },

  budgetStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 10, borderRadius: Radius.md, marginBottom: Spacing.md,
  },
  budgetStatusOk: { backgroundColor: Colors.successLight },
  budgetStatusWarn: { backgroundColor: Colors.warningLight },
  budgetStatusText: { fontFamily: Typography.medium, fontSize: 13 },

  budgetBar: { height: 6, backgroundColor: Colors.divider, borderRadius: 3, overflow: 'hidden' },
  budgetBarFill: { height: '100%', borderRadius: 3 },

  currencyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  currencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currencySymbolBig: { fontFamily: Typography.monoBold, fontSize: 28, color: Colors.accent, width: 40 },
  currencyCode: { fontFamily: Typography.semiBold, fontSize: 14, color: Colors.textPrimary },
  currencyName: { fontFamily: Typography.regular, fontSize: 12, color: Colors.textSecondary },

  appearanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  appearanceLabel: { fontFamily: Typography.medium, fontSize: 15, color: Colors.textPrimary },

  statsGrid: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: Typography.monoBold, fontSize: 20, color: Colors.textPrimary },
  statLabel: { fontFamily: Typography.regular, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.divider },

  aboutHeaderWrap: { alignItems: 'center', marginBottom: Spacing.lg, paddingVertical: Spacing.sm },
  aboutLogo: { width: 96, height: 96, borderRadius: 24, marginBottom: Spacing.sm },
  aboutAppName: { fontFamily: Typography.bold, fontSize: 18, color: Colors.textPrimary },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  aboutKey: { fontFamily: Typography.regular, fontSize: 14, color: Colors.textSecondary },
  aboutVal: { fontFamily: Typography.medium, fontSize: 14, color: Colors.textPrimary },

  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dangerLight, borderRadius: Radius.md,
    padding: 12, marginBottom: Spacing.sm,
  },
  clearBtnText: { fontFamily: Typography.semiBold, fontSize: 15, color: Colors.danger },
  clearWarning: { fontFamily: Typography.regular, fontSize: 12, color: Colors.textMuted },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    padding: Spacing.xl, paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.divider, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontFamily: Typography.bold, fontSize: 18, color: Colors.textPrimary, marginBottom: Spacing.lg },
  currencyOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: Radius.lg, marginBottom: 8,
    backgroundColor: Colors.bg,
  },
  currencyOptionActive: { backgroundColor: Colors.accentMuted, borderWidth: 1, borderColor: Colors.accentDim },
  currencyOptionSymbol: { fontFamily: Typography.monoBold, fontSize: 20, color: Colors.accent, width: 30 },
  currencyOptionCode: { fontFamily: Typography.semiBold, fontSize: 14, color: Colors.textPrimary },
  currencyOptionName: { fontFamily: Typography.regular, fontSize: 12, color: Colors.textSecondary },
  modalClose: {
    marginTop: 8, padding: 14, backgroundColor: Colors.bg,
    borderRadius: Radius.lg, alignItems: 'center',
  },
  modalCloseText: { fontFamily: Typography.semiBold, fontSize: 15, color: Colors.textSecondary },
});
