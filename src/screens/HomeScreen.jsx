// screens/HomeScreen.jsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Animated, Alert, ActivityIndicator,
  StatusBar, Platform, Pressable, LayoutAnimation, UIManager,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme, Typography, Spacing, Radius, Shadow, getCategoryById } from '../theme';
import { useApp } from '../context/AppContext';
import {
  formatAmount, formatAmountFull, formatDate,
  filterByMonth, isThisWeek, isThisMonth,
} from '../utils/helpers';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS = [
  { key: 'All', icon: 'apps' },
  { key: 'This Week', icon: 'date-range' },
  { key: 'This Month', icon: 'calendar-today' },
  { key: 'Income', icon: 'arrow-downward' },
  { key: 'Expense', icon: 'arrow-upward' },
];

// ─── Sparkline Mini Chart ────────────────────────────────────────────────────
function SparkBar({ value, max, color }) {
  const Colors = useTheme();
  const sparkStyles = useMemo(() => get_sparkStyles(Colors), [Colors]);
  const pillStyles = useMemo(() => get_pillStyles(Colors), [Colors]);
  const catStyles = useMemo(() => get_catStyles(Colors), [Colors]);
  const txnStyles = useMemo(() => get_txnStyles(Colors), [Colors]);
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value / max, useNativeDriver: false, delay: 200 }).start();
  }, [value]);
  return (
    <View style={sparkStyles.track}>
      <Animated.View style={[sparkStyles.fill, { backgroundColor: color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
}
const get_sparkStyles = (Colors) => StyleSheet.create({
  track: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});

// ─── Stat Pill ───────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, color, bg }) {
  const Colors = useTheme();
  const sparkStyles = useMemo(() => get_sparkStyles(Colors), [Colors]);
  const pillStyles = useMemo(() => get_pillStyles(Colors), [Colors]);
  const catStyles = useMemo(() => get_catStyles(Colors), [Colors]);
  const txnStyles = useMemo(() => get_txnStyles(Colors), [Colors]);
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  const scale = useRef(new Animated.Value(1)).current;
  const press = () => Animated.sequence([
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }),
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
  ]).start();
  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <TouchableOpacity style={[pillStyles.pill, { backgroundColor: bg }]} onPress={press} activeOpacity={0.85}>
        <View style={[pillStyles.iconWrap, { backgroundColor: color + '25' }]}>
          <MaterialIcons name={icon} size={15} color={color} />
        </View>
        <Text style={[pillStyles.value, { color }]}>{value}</Text>
        <Text style={pillStyles.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const get_pillStyles = (Colors) => StyleSheet.create({
  pill: { borderRadius: 16, padding: 14, alignItems: 'flex-start', gap: 6 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: Typography.monoBold, fontSize: 16, letterSpacing: -0.5 },
  label: { fontFamily: Typography.regular, fontSize: 11, color: Colors.textSecondary },
});

// ─── Category Breakdown Bar ───────────────────────────────────────────────────
function CategoryBreakdown({ transactions, currency }) {
  const Colors = useTheme();
  const sparkStyles = useMemo(() => get_sparkStyles(Colors), [Colors]);
  const pillStyles = useMemo(() => get_pillStyles(Colors), [Colors]);
  const catStyles = useMemo(() => get_catStyles(Colors), [Colors]);
  const txnStyles = useMemo(() => get_txnStyles(Colors), [Colors]);
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  const breakdown = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((s, t) => s + parseFloat(t.amount), 0);
    const map = {};
    expenses.forEach(t => {
      map[t.category] = (map[t.category] || 0) + parseFloat(t.amount);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cat, amt]) => ({ cat, amt, pct: total ? (amt / total) * 100 : 0 }));
  }, [transactions]);

  const widths = useRef(breakdown.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    breakdown.forEach((item, i) => {
      Animated.spring(widths[i] || new Animated.Value(0), {
        toValue: item.pct,
        delay: i * 80,
        useNativeDriver: false,
      }).start();
    });
  }, [breakdown]);

  if (!breakdown.length) return null;

  return (
    <View style={catStyles.wrap}>
      <Text style={catStyles.title}>Top Spending</Text>
      {breakdown.map(({ cat, amt, pct }, i) => {
        const catInfo = getCategoryById(cat);
        const animWidth = widths[i] || new Animated.Value(pct);
        return (
          <View key={cat} style={catStyles.row}>
            <View style={[catStyles.dot, { backgroundColor: catInfo.color }]} />
            <Text style={catStyles.catLabel} numberOfLines={1}>{catInfo.label}</Text>
            <View style={catStyles.barTrack}>
              <Animated.View style={[catStyles.barFill, {
                backgroundColor: catInfo.color,
                width: animWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              }]} />
            </View>
            <Text style={catStyles.catAmt}>{formatAmount(amt, currency)}</Text>
          </View>
        );
      })}
    </View>
  );
}
const get_catStyles = (Colors) => StyleSheet.create({
  wrap: { marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.divider, marginBottom: Spacing.base },
  title: { fontFamily: Typography.semiBold, fontSize: 14, color: Colors.textPrimary, marginBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  catLabel: { fontFamily: Typography.regular, fontSize: 12, color: Colors.textSecondary, width: 68 },
  barTrack: { flex: 1, height: 5, backgroundColor: Colors.divider, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  catAmt: { fontFamily: Typography.monoBold, fontSize: 12, color: Colors.textPrimary, width: 60, textAlign: 'right' },
});

// ─── Transaction Card ─────────────────────────────────────────────────────────
function TransactionCard({ item, onPress, onDelete, currency }) {
  const Colors = useTheme();
  const sparkStyles = useMemo(() => get_sparkStyles(Colors), [Colors]);
  const pillStyles = useMemo(() => get_pillStyles(Colors), [Colors]);
  const catStyles = useMemo(() => get_catStyles(Colors), [Colors]);
  const txnStyles = useMemo(() => get_txnStyles(Colors), [Colors]);
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  const swipeRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  const cat = getCategoryById(item.category);
  const isIncome = item.type === 'income';

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp' });
    const opacity = dragX.interpolate({ inputRange: [-80, -20], outputRange: [1, 0], extrapolate: 'clamp' });
    return (
      <TouchableOpacity
        style={txnStyles.deleteAction}
        onPress={() => {
          swipeRef.current?.close();
          onDelete(item.id, item.title);
        }}
      >
        <Animated.View style={{ transform: [{ scale }], opacity, alignItems: 'center' }}>
          <MaterialIcons name="delete-outline" size={22} color="#fff" />
          <Text style={txnStyles.deleteText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        overshootRight={false}
      >
        <Pressable
          style={({ pressed }) => [txnStyles.card, pressed && txnStyles.cardPressed]}
          onPress={() => onPress(item)}
        >
          {/* Category Icon */}
          <View style={[txnStyles.iconWrap, { backgroundColor: cat.bg }]}>
            <MaterialIcons name={cat.icon} size={20} color={cat.color} />
          </View>

          {/* Info */}
          <View style={txnStyles.info}>
            <Text style={txnStyles.title} numberOfLines={1}>{item.title}</Text>
            <View style={txnStyles.metaRow}>
              <View style={[txnStyles.typeBadge, { backgroundColor: isIncome ? Colors.incomeLight : Colors.expenseLight }]}>
                <Text style={[txnStyles.typeText, { color: isIncome ? Colors.income : Colors.accent }]}>
                  {isIncome ? 'Income' : 'Expense'}
                </Text>
              </View>
              <Text style={txnStyles.date}>{formatDate(item.date)}</Text>
            </View>
          </View>

          {/* Amount */}
          <View style={txnStyles.amountCol}>
            <Text style={[txnStyles.amount, { color: isIncome ? Colors.income : Colors.accent }]}>
              {isIncome ? '+' : '-'}{formatAmount(item.amount, currency)}
            </Text>
            <Text style={txnStyles.catLabel}>{cat.label}</Text>
          </View>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}

const get_txnStyles = (Colors) => StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base, marginBottom: 8,
    padding: Spacing.md, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.divider,
  },
  cardPressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  title: { fontFamily: Typography.semiBold, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontFamily: Typography.medium, fontSize: 10 },
  date: { fontFamily: Typography.regular, fontSize: 11, color: Colors.textMuted },
  amountCol: { alignItems: 'flex-end' },
  amount: { fontFamily: Typography.monoBold, fontSize: 15 },
  catLabel: { fontFamily: Typography.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  deleteAction: {
    backgroundColor: Colors.danger,
    marginBottom: 8, marginRight: Spacing.base,
    borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
    width: 76,
  },
  deleteText: { fontFamily: Typography.medium, fontSize: 10, color: '#fff', marginTop: 3 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const Colors = useTheme();
  const sparkStyles = useMemo(() => get_sparkStyles(Colors), [Colors]);
  const pillStyles = useMemo(() => get_pillStyles(Colors), [Colors]);
  const catStyles = useMemo(() => get_catStyles(Colors), [Colors]);
  const txnStyles = useMemo(() => get_txnStyles(Colors), [Colors]);
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  const { transactions, settings, loading, deleteTransaction } = useApp();
  const [filter, setFilter] = useState('This Month');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedMonth] = useState(new Date());
  const scrollY = useRef(new Animated.Value(0)).current;

  const filtered = useMemo(() => {
    let list = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    switch (filter) {
      case 'This Week': return list.filter(t => isThisWeek(t.date));
      case 'This Month': return list.filter(t => isThisMonth(t.date));
      case 'Income': return list.filter(t => t.type === 'income');
      case 'Expense': return list.filter(t => t.type === 'expense');
      default: return list;
    }
  }, [transactions, filter]);

  const monthlyTotals = useMemo(() => {
    const monthTxns = filterByMonth(transactions, selectedMonth);
    const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
    return { income, expense, net: income - expense };
  }, [transactions, selectedMonth]);

  const budgetUsed = settings.monthlyBudget ? (monthlyTotals.expense / settings.monthlyBudget) * 100 : 0;
  const budgetExceeded = monthlyTotals.expense > settings.monthlyBudget;
  const isPositiveNet = monthlyTotals.net >= 0;

  // Animated header compression on scroll
  const headerBg = scrollY.interpolate({ inputRange: [0, 60], outputRange: ['transparent', Colors.bg], extrapolate: 'clamp' });
  const headerElevation = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, 8], extrapolate: 'clamp' });

  const handleDelete = useCallback((id, title) => {
    Alert.alert('Delete Transaction', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          deleteTransaction(id);
        }
      },
    ]);
  }, [deleteTransaction]);

  const toggleBreakdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowBreakdown(v => !v);
  };

  const handleFilterChange = (f) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilter(f);
  };

  const savingsRate = monthlyTotals.income > 0
    ? Math.round((monthlyTotals.net / monthlyTotals.income) * 100)
    : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading your finances…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Sticky floating header */}
      <Animated.View style={[styles.stickyHeader, { backgroundColor: headerBg, shadowOpacity: headerElevation }]}>
        <Text style={styles.headerTitle}>Expense Tracker</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, styles.headerBtnPrimary]}
            onPress={() => navigation.navigate('AddExpenseModal')}
          >
            <MaterialIcons name="add" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Hero Summary Card */}
        <View style={styles.heroCard}>
          {/* Top row: net + budget badge */}
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Net Balance · {new Date().toLocaleString('default', { month: 'long' })}</Text>
              <Text style={[styles.heroBalance, { color: isPositiveNet ? Colors.income : Colors.accent }]}>
                {isPositiveNet ? '+' : ''}{formatAmountFull(monthlyTotals.net, settings.currency)}
              </Text>
            </View>
            <View style={[styles.trendBadge, { backgroundColor: isPositiveNet ? Colors.incomeLight : Colors.expenseLight }]}>
              <MaterialIcons
                name={isPositiveNet ? 'trending-up' : 'trending-down'}
                size={18}
                color={isPositiveNet ? Colors.income : Colors.accent}
              />
              <Text style={[styles.trendText, { color: isPositiveNet ? Colors.income : Colors.accent }]}>
                {isPositiveNet ? '+' : ''}{savingsRate}%
              </Text>
            </View>
          </View>

          {/* Income / Expense pills */}
          <View style={styles.pillRow}>
            <StatPill
              icon="arrow-downward"
              label="Income"
              value={formatAmount(monthlyTotals.income, settings.currency)}
              color={Colors.income}
              bg={Colors.incomeLight}
            />
            <View style={{ width: 10 }} />
            <StatPill
              icon="arrow-upward"
              label="Expenses"
              value={formatAmount(monthlyTotals.expense, settings.currency)}
              color={Colors.accent}
              bg={Colors.expenseLight}
            />
          </View>

          {/* Budget progress */}
          <View style={styles.budgetSection}>
            <View style={styles.budgetRow}>
              <View style={styles.budgetLeft}>
                <MaterialIcons
                  name={budgetExceeded ? 'warning-amber' : 'account-balance-wallet'}
                  size={14}
                  color={budgetExceeded ? Colors.warning : Colors.textSecondary}
                />
                <Text style={[styles.budgetLabel, budgetExceeded && { color: Colors.warning }]}>
                  {budgetExceeded ? 'Budget exceeded!' : `Budget — ${Math.round(budgetUsed)}% used`}
                </Text>
              </View>
              <Text style={styles.budgetFigure}>
                {formatAmount(monthlyTotals.expense, settings.currency)} / {formatAmount(settings.monthlyBudget, settings.currency)}
              </Text>
            </View>
            <View style={styles.budgetTrack}>
              <SparkBar value={Math.min(budgetUsed, 100)} max={100} color={budgetExceeded ? Colors.warning : Colors.accent} />
            </View>
          </View>

          {/* Breakdown toggle */}
          <TouchableOpacity style={styles.breakdownToggle} onPress={toggleBreakdown} activeOpacity={0.7}>
            <Text style={styles.breakdownToggleText}>
              {showBreakdown ? 'Hide breakdown' : 'Show spending breakdown'}
            </Text>
            <MaterialIcons
              name={showBreakdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={18}
              color={Colors.accent}
            />
          </TouchableOpacity>
        </View>

        {/* Category breakdown (animated toggle) */}
        {showBreakdown && (
          <CategoryBreakdown transactions={filterByMonth(transactions, selectedMonth)} currency={settings.currency} />
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'add-circle-outline', label: 'Add', screen: 'AddExpenseModal', color: Colors.accent },
            { icon: 'bar-chart', label: 'Analytics', screen: 'Analytics', color: '#A78BFA' },
            // { icon: 'receipt-long', label: 'History', screen: 'History', color: '#34D399' },
            { icon: 'settings', label: 'Settings', screen: 'Settings', color: Colors.textSecondary },
          ].map(({ icon, label, screen, color }) => (
            <TouchableOpacity
              key={screen}
              style={styles.quickBtn}
              onPress={() => navigation.navigate(screen)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIcon, { backgroundColor: color + '18' }]}>
                <MaterialIcons name={icon} size={22} color={color} />
              </View>
              <Text style={styles.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterBar}
        >
          {FILTERS.map(({ key, icon }) => {
            const active = filter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => handleFilterChange(key)}
                activeOpacity={0.75}
              >
                <MaterialIcons name={icon} size={13} color={active ? Colors.accent : Colors.textMuted} />
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Transactions List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Transactions</Text>
          <View style={styles.listCountBadge}>
            <Text style={styles.listCount}>{filtered.length}</Text>
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="receipt-long" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>
              {filter === 'All' ? 'Tap + to add your first transaction' : `No records for "${filter}"`}
            </Text>
            {filter !== 'All' && (
              <TouchableOpacity style={styles.emptyAction} onPress={() => handleFilterChange('All')}>
                <Text style={styles.emptyActionText}>View all transactions</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(item => (
            <TransactionCard
              key={item.id}
              item={item}
              currency={settings.currency}
              onPress={(t) => navigation.navigate('TransactionDetail', { transaction: t })}
              onDelete={handleDelete}
            />
          ))
        )}
      </Animated.ScrollView>
    </View>
  );
}

const get_styles = (Colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: Typography.regular, fontSize: 14, color: Colors.textSecondary },
  scrollContent: { paddingBottom: 140, paddingTop: Platform.OS === 'ios' ? 100 : 80 },

  // Sticky header
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 52 : 28,
    paddingBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: { fontFamily: Typography.bold, fontSize: 22, color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBtnPrimary: { backgroundColor: Colors.accentMuted, borderColor: Colors.accentDim },

  // Hero card
  heroCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.cardBorder,
    ...Shadow.card,
    marginBottom: Spacing.base,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  heroLabel: { fontFamily: Typography.regular, fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  heroBalance: { fontFamily: Typography.mono, fontSize: 32, letterSpacing: -1 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  trendText: { fontFamily: Typography.monoBold, fontSize: 13 },

  pillRow: { flexDirection: 'row', marginBottom: Spacing.lg },

  budgetSection: { gap: 8 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  budgetLabel: { fontFamily: Typography.medium, fontSize: 12, color: Colors.textSecondary },
  budgetFigure: { fontFamily: Typography.mono, fontSize: 12, color: Colors.textMuted },
  budgetTrack: { flexDirection: 'row' },

  breakdownToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: 1, borderColor: Colors.divider, gap: 4,
  },
  breakdownToggleText: { fontFamily: Typography.medium, fontSize: 13, color: Colors.accent },

  // Quick actions
  quickActions: {
    flexDirection: 'row', marginHorizontal: Spacing.base,
    marginBottom: Spacing.base, gap: 8,
  },
  quickBtn: { flex: 1, alignItems: 'center', gap: 6 },
  quickIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: Typography.medium, fontSize: 11, color: Colors.textSecondary },

  // Filter bar
  filterBar: { marginBottom: Spacing.base },
  filterScroll: { paddingHorizontal: Spacing.base, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.divider,
  },
  filterChipActive: { backgroundColor: Colors.accentMuted, borderColor: Colors.accentDim },
  filterText: { fontFamily: Typography.medium, fontSize: 12, color: Colors.textSecondary },
  filterTextActive: { color: Colors.accent },

  // List header
  listHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, marginBottom: 12, gap: 8,
  },
  listTitle: { fontFamily: Typography.semiBold, fontSize: 16, color: Colors.textPrimary },
  listCountBadge: { backgroundColor: Colors.accentMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  listCount: { fontFamily: Typography.medium, fontSize: 12, color: Colors.accent },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontFamily: Typography.semiBold, fontSize: 17, color: Colors.textSecondary },
  emptyBody: { fontFamily: Typography.regular, fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  emptyAction: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.accentMuted, borderRadius: Radius.full },
  emptyActionText: { fontFamily: Typography.medium, fontSize: 13, color: Colors.accent },

  // FAB
  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
});