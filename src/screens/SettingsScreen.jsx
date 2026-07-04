// screens/SettingsScreen.jsx
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ScrollView, Platform, Modal, FlatList, Image,
  Animated, Pressable,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getThemeColors, Typography, Spacing, Radius, Shadow } from '../theme';
import { useApp } from '../context/AppContext';
import { useLayers } from '../context/LayerContext';
import { CURRENCIES } from '../utils/storage';
import { formatAmount } from '../utils/helpers';

// ─── Animated Theme Toggle ─────────────────────────────────────────────────────
const TOGGLE_W  = 58;
const TOGGLE_H  = 30;
const THUMB_SZ  = 24;
const THUMB_OFF = 3; // gap from edge

function AnimatedThemeToggle({ value, onToggle, activeColor }) {
  const animVal = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animVal, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      damping: 15,
      mass: 0.8,
      stiffness: 180,
    }).start();
  }, [value]);

  const thumbX = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMB_OFF, TOGGLE_W - THUMB_SZ - THUMB_OFF],
  });

  const trackColor = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(100,100,120,0.35)', activeColor],
  });

  const sunOpacity  = animVal.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' });
  const moonOpacity = animVal.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <Pressable onPress={() => onToggle(!value)}>
      <Animated.View style={{
        width: TOGGLE_W, height: TOGGLE_H, borderRadius: TOGGLE_H / 2,
        backgroundColor: trackColor, justifyContent: 'center',
        // glow when dark is active
        shadowColor: activeColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: value ? 0.45 : 0,
        shadowRadius: 8,
        elevation: value ? 6 : 0,
      }}>
        {/* Sliding thumb */}
        <Animated.View style={{
          position: 'absolute',
          left: thumbX,
          width: THUMB_SZ, height: THUMB_SZ, borderRadius: THUMB_SZ / 2,
          backgroundColor: '#fff',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
        }}>
          {/* Sun icon — shown when light */}
          <Animated.View style={{ position: 'absolute', opacity: sunOpacity }}>
            <MaterialIcons name="wb-sunny" size={13} color="#F97316" />
          </Animated.View>
          {/* Moon icon — shown when dark */}
          <Animated.View style={{ position: 'absolute', opacity: moonOpacity }}>
            <MaterialIcons name="nights-stay" size={13} color="#6366F1" />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }) {

  const { settings, updateSettings, clearData, allTransactions } = useApp();
  const { activeLayer, editLayer } = useLayers();
  const Colors = getThemeColors(settings.theme);
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  // Layer-scoped settings (fall back to global if no active layer)
  const layerCurrency = activeLayer?.currency ?? settings.currency;
  const layerCurrCode = activeLayer?.currencyCode ?? settings.currencyCode;

  // Layer-scoped transactions
  const transactions = useMemo(() => {
    if (!activeLayer) return allTransactions;
    return allTransactions.filter(t => t.layerId === activeLayer.id || (!t.layerId && activeLayer.id === 'layer_default'));
  }, [allTransactions, activeLayer]);

  const [showCurrency, setShowCurrency] = useState(false);

  const totalExpense = transactions
    .filter(t => {
      const d = new Date(t.date);
      const now = new Date();
      return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, t) => s + parseFloat(t.amount), 0);

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
    if (activeLayer) {
      await editLayer({ ...activeLayer, currency: curr.symbol, currencyCode: curr.code });
    } else {
      await updateSettings({ currency: curr.symbol, currencyCode: curr.code });
    }
    setShowCurrency(false);
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        {activeLayer && (
          <TouchableOpacity
            style={[styles.layerBadge, { backgroundColor: activeLayer.color + '22', borderColor: activeLayer.color + '55' }]}
            onPress={() => navigation.navigate('Layers')}
          >
            <MaterialIcons name={activeLayer.icon} size={14} color={activeLayer.color} />
            <Text style={[styles.layerBadgeText, { color: activeLayer.color }]}>{activeLayer.name}</Text>
            <MaterialIcons name="chevron-right" size={14} color={activeLayer.color} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Budgets shortcut */}
      <TouchableOpacity style={styles.sectionCard} onPress={() => navigation.navigate('Budgets')} activeOpacity={0.8}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="pie-chart" size={18} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Category Budgets</Text>
          <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
        </View>
        <Text style={styles.budgetHint}>
          Set spending limits per category over weekly, monthly, custom or lifetime periods.
        </Text>
      </TouchableOpacity>

      {/* Currency Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="attach-money" size={18} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Currency</Text>
        </View>

        <TouchableOpacity style={styles.currencyRow} onPress={() => setShowCurrency(true)}>
          <View style={styles.currencyLeft}>
            <Text style={styles.currencySymbolBig}>{layerCurrency}</Text>
            <View>
              <Text style={styles.currencyCode}>{layerCurrCode}</Text>
              <Text style={styles.currencyName}>
                {CURRENCIES.find(c => c.code === layerCurrCode)?.label || 'Currency'}
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
          <View style={styles.appearanceLeft}>
            <View style={[styles.themeIconBadge, { backgroundColor: Colors.accentMuted }]}>
              <MaterialIcons
                name={settings.theme === 'light' ? 'wb-sunny' : 'nights-stay'}
                size={16}
                color={Colors.accent}
              />
            </View>
            <View>
              <Text style={styles.appearanceLabel}>
                {settings.theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </Text>
              <Text style={styles.appearanceSub}>Tap to toggle</Text>
            </View>
          </View>
          <AnimatedThemeToggle
            value={settings.theme !== 'light'}
            onToggle={(val) => updateSettings({ theme: val ? 'dark' : 'light' })}
            activeColor={Colors.accent}
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
              {formatAmount(totalExpense, layerCurrency)}
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
                style={[styles.currencyOption, layerCurrCode === curr.code && styles.currencyOptionActive]}
                onPress={() => handleCurrencySelect(curr)}
              >
                <Text style={styles.currencyOptionSymbol}>{curr.symbol}</Text>
                <View>
                  <Text style={styles.currencyOptionCode}>{curr.code}</Text>
                  <Text style={styles.currencyOptionName}>{curr.label}</Text>
                </View>
                {layerCurrCode === curr.code && (
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
  layerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
    borderWidth: 1, marginTop: 8, alignSelf: 'flex-start',
  },
  layerBadgeText: { fontFamily: Typography.medium, fontSize: 12 },

  sectionCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  dangerCard: { borderColor: Colors.dangerLight },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  sectionTitle: { fontFamily: Typography.semiBold, fontSize: 15, color: Colors.textPrimary },

  budgetHint: { fontFamily: Typography.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
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

  appearanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  appearanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeIconBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  appearanceLabel: { fontFamily: Typography.medium, fontSize: 15, color: Colors.textPrimary },
  appearanceSub: { fontFamily: Typography.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },

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
