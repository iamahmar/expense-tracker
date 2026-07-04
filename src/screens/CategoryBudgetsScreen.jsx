// screens/CategoryBudgetsScreen.jsx — Category Budget Dashboard
import React, { useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  useTheme, Typography, Spacing, Radius, Shadow, Animation,
  getCategoryById, getStatusColors,
} from '../theme';
import { useApp } from '../context/AppContext';
import { useLayers } from '../context/LayerContext';
import { useCategoryBudgets } from '../context/CategoryBudgetContext';
import { formatAmount, formatDate } from '../utils/helpers';
import {
  getBudgetStats, getBudgetAlert, getPeriodMeta, formatWindowLabel,
} from '../utils/budgetPeriods';

// ─── Animated progress bar ──────────────────────────────────────────────────────
function ProgressBar({ pct, color, over }) {
  const Colors = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const clamped = Math.min(100, pct);
  useEffect(() => {
    Animated.spring(anim, { toValue: clamped, ...Animation.springSmooth, useNativeDriver: false }).start();
  }, [clamped]);
  return (
    <View style={{ height: 8, backgroundColor: Colors.dividerStrong, borderRadius: 4, overflow: 'hidden' }}>
      <Animated.View style={{
        height: '100%', borderRadius: 4,
        backgroundColor: over ? Colors.danger : color,
        width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }} />
    </View>
  );
}

// ─── Budget card ────────────────────────────────────────────────────────────────
function BudgetCard({ budget, stats, currency, onPress, index }) {
  const Colors = useTheme();
  const s = useMemo(() => get_card(Colors), [Colors]);
  const cat = getCategoryById(budget.category);
  const alert = getBudgetAlert(stats);
  const periodMeta = getPeriodMeta(budget.period);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 60, ...Animation.springSmooth, useNativeDriver: true }).start();
  }, []);

  const alertColors = alert ? getStatusColors(alert.level === 'muted' ? 'info' : alert.level, Colors) : null;

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
        <View style={s.top}>
          <View style={[s.icon, { backgroundColor: cat.bg }]}>
            <MaterialIcons name={cat.icon} size={20} color={cat.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{cat.label}</Text>
            <View style={s.metaRow}>
              <MaterialIcons name={periodMeta.icon} size={11} color={Colors.textMuted} />
              <Text style={s.meta}>{formatWindowLabel(budget)}{budget.recurring ? ' · repeats' : ''}</Text>
            </View>
          </View>
          {alert && (
            <View style={[s.badge, { backgroundColor: alertColors.bg, borderColor: alertColors.border }]}>
              <MaterialIcons name={alert.icon} size={11} color={alertColors.color} />
              <Text style={[s.badgeTxt, { color: alertColors.color }]}>{alert.label}</Text>
            </View>
          )}
        </View>

        <ProgressBar pct={stats.pct} color={cat.color} over={stats.over} />

        <View style={s.figures}>
          <Text style={s.spent}>
            {formatAmount(stats.spent, currency)}
            <Text style={s.of}> / {formatAmount(stats.amount, currency)}</Text>
          </Text>
          <Text style={[s.remaining, { color: stats.over ? Colors.danger : Colors.textSecondary }]}>
            {stats.over
              ? `${formatAmount(Math.abs(stats.remaining), currency)} over`
              : `${formatAmount(stats.remaining, currency)} left`}
          </Text>
        </View>

        <View style={s.footer}>
          <Text style={s.pct}>{stats.pct.toFixed(0)}% used</Text>
          {stats.daysLeft != null && !stats.expired && (
            <Text style={s.footMeta}>{stats.daysLeft}d left</Text>
          )}
          {stats.predictedOverspend && !stats.over && (
            <Text style={[s.footMeta, { color: Colors.warning }]}>
              ~{formatAmount(stats.forecast, currency)} projected
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const get_card = (Colors) => StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder, gap: 10, ...Shadow.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: Typography.semiBold, fontSize: 14, color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { fontFamily: Typography.regular, fontSize: 11, color: Colors.textMuted },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  badgeTxt: { fontFamily: Typography.medium, fontSize: 10 },
  figures: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  spent: { fontFamily: Typography.monoBold, fontSize: 15, color: Colors.textPrimary },
  of: { fontFamily: Typography.mono, fontSize: 12, color: Colors.textMuted },
  remaining: { fontFamily: Typography.medium, fontSize: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pct: { fontFamily: Typography.regular, fontSize: 11, color: Colors.textSecondary },
  footMeta: { fontFamily: Typography.regular, fontSize: 11, color: Colors.textMuted },
});

// ─── Summary stat ────────────────────────────────────────────────────────────────
function SummaryStat({ label, value, color }) {
  const Colors = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: Typography.monoBold, fontSize: 16, color, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontFamily: Typography.regular, fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────────
export default function CategoryBudgetsScreen({ navigation }) {
  const Colors = useTheme();
  const s = useMemo(() => get_styles(Colors), [Colors]);

  const { allTransactions, settings } = useApp();
  const { activeLayer } = useLayers();
  const { budgets } = useCategoryBudgets();

  const currency = activeLayer?.currency ?? settings.currency;

  // Scope to active layer (mirrors AnalyticsScreen's fallback for legacy txns).
  const layerTxns = useMemo(() => {
    if (!activeLayer) return allTransactions;
    return allTransactions.filter(t => t.layerId === activeLayer.id || (!t.layerId && activeLayer.id === 'layer_default'));
  }, [allTransactions, activeLayer]);

  const layerBudgets = useMemo(() => {
    if (!activeLayer) return budgets;
    return budgets.filter(b => b.layerId === activeLayer.id || (!b.layerId && activeLayer.id === 'layer_default'));
  }, [budgets, activeLayer]);

  // Compute stats once per render, sorted: alerts first, then by % used.
  const computed = useMemo(() => {
    const rank = { danger: 0, warning: 1, info: 2, muted: 4, none: 3 };
    return layerBudgets
      .map(b => ({ budget: b, stats: getBudgetStats(b, layerTxns) }))
      .sort((a, a2) => {
        const la = getBudgetAlert(a.stats)?.level ?? 'none';
        const lb = getBudgetAlert(a2.stats)?.level ?? 'none';
        if (rank[la] !== rank[lb]) return rank[la] - rank[lb];
        return a2.stats.pct - a.stats.pct;
      });
  }, [layerBudgets, layerTxns]);

  const totals = useMemo(() => {
    // Every budget's cap counts toward the allocated total — including lifetime
    // budgets, whose amount is a real spending limit (just with no end date).
    return computed.reduce((acc, { stats }) => {
      acc.allocated += stats.amount;
      acc.spent += stats.spent;
      return acc;
    }, { allocated: 0, spent: 0 });
  }, [computed]);

  const alerts = useMemo(() =>
    computed
      .map(({ budget, stats }) => ({ budget, stats, alert: getBudgetAlert(stats) }))
      .filter(x => x.alert && ['danger', 'warning'].includes(x.alert.level)),
    [computed]
  );

  const recentExpenses = useMemo(() =>
    [...layerTxns]
      .filter(t => t.type === 'expense')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4),
    [layerTxns]
  );

  // At-a-glance health: how many budgets are on track / at risk / over.
  const statusCounts = useMemo(() =>
    computed.reduce((acc, { stats }) => {
      if (stats.over) acc.over++;
      else if (stats.pct >= 80 || stats.predictedOverspend) acc.risk++;
      else acc.ok++;
      return acc;
    }, { ok: 0, risk: 0, over: 0 }),
    [computed]
  );

  // Bounded budgets whose current window ends within a week.
  const expiring = useMemo(() =>
    computed
      .filter(({ stats }) => stats.daysLeft != null && !stats.expired && stats.daysLeft <= 7)
      .sort((a, b) => a.stats.daysLeft - b.stats.daysLeft),
    [computed]
  );

  // Highest spending categories in this layer, flagged if they already have a budget.
  const topCategories = useMemo(() => {
    const map = {};
    layerTxns.forEach(t => {
      if (t.type !== 'expense') return;
      map[t.category] = (map[t.category] || 0) + parseFloat(t.amount || 0);
    });
    const budgeted = new Set(layerBudgets.map(b => b.category));
    const arr = Object.entries(map)
      .map(([id, amt]) => ({ id, amt, budgeted: budgeted.has(id) }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 5);
    return { arr, max: arr.length ? arr[0].amt : 0 };
  }, [layerTxns, layerBudgets]);

  const isEmpty = computed.length === 0;

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Category Budgets</Text>
          <Text style={s.subtitle}>{activeLayer ? activeLayer.name : 'Independent of monthly budget'}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('CreateCategoryBudgetModal')}>
          <MaterialIcons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <MaterialIcons name="account-balance-wallet" size={40} color={Colors.accent} />
          </View>
          <Text style={s.emptyTitle}>No category budgets yet</Text>
          <Text style={s.emptyBody}>
            Set spending limits per category — weekly, monthly, custom periods or lifetime — separate from your monthly budget.
          </Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('CreateCategoryBudgetModal')}>
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={s.emptyBtnTxt}>Create your first budget</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Overview card */}
          <View style={s.overview}>
            <View style={s.overviewRow}>
              <SummaryStat label="Total allocated" value={formatAmount(totals.allocated, currency)} color={Colors.textPrimary} />
              <View style={s.vDivider} />
              <SummaryStat label="Spent" value={formatAmount(totals.spent, currency)} color={Colors.accent} />
              <View style={s.vDivider} />
              <SummaryStat
                label="Remaining"
                value={formatAmount(Math.max(0, totals.allocated - totals.spent), currency)}
                color={Colors.success}
              />
            </View>
            <View style={s.overviewBarWrap}>
              <ProgressBar
                pct={totals.allocated > 0 ? (totals.spent / totals.allocated) * 100 : 0}
                color={Colors.accent}
                over={totals.spent > totals.allocated && totals.allocated > 0}
              />
            </View>
            <Text style={s.overviewMeta}>
              {computed.length} budget{computed.length !== 1 ? 's' : ''} ·{' '}
              {totals.allocated > 0 ? Math.round((totals.spent / totals.allocated) * 100) : 0}% of allocated spent
            </Text>
            <View style={s.statusRow}>
              <View style={s.statusChip}>
                <View style={[s.statusDot, { backgroundColor: Colors.success }]} />
                <Text style={s.statusChipTxt}>{statusCounts.ok} on track</Text>
              </View>
              <View style={s.statusChip}>
                <View style={[s.statusDot, { backgroundColor: Colors.warning }]} />
                <Text style={s.statusChipTxt}>{statusCounts.risk} at risk</Text>
              </View>
              <View style={s.statusChip}>
                <View style={[s.statusDot, { backgroundColor: Colors.danger }]} />
                <Text style={s.statusChipTxt}>{statusCounts.over} over</Text>
              </View>
            </View>
          </View>

          {/* Alerts */}
          {alerts.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Needs attention</Text>
              {alerts.map(({ budget, stats, alert }) => {
                const cat = getCategoryById(budget.category);
                const ac = getStatusColors(alert.level, Colors);
                return (
                  <View key={budget.id} style={[s.alertRow, { borderLeftColor: ac.color }]}>
                    <MaterialIcons name={alert.icon} size={18} color={ac.color} />
                    <Text style={s.alertTxt}>
                      <Text style={{ color: Colors.textPrimary, fontFamily: Typography.semiBold }}>{cat.label}</Text>
                      {' — '}{alert.label} ({stats.pct.toFixed(0)}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Upcoming expirations */}
          {expiring.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Expiring soon</Text>
              {expiring.map(({ budget, stats }) => {
                const cat = getCategoryById(budget.category);
                return (
                  <TouchableOpacity
                    key={budget.id}
                    style={s.expRow}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('CreateCategoryBudgetModal', { budget })}
                  >
                    <View style={[s.expIcon, { backgroundColor: cat.bg }]}>
                      <MaterialIcons name="schedule" size={16} color={cat.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.recentTitle} numberOfLines={1}>{cat.label}</Text>
                      <Text style={s.recentMeta}>{formatWindowLabel(budget)}</Text>
                    </View>
                    <View style={s.expDaysWrap}>
                      <Text style={[s.expDays, { color: stats.daysLeft <= 3 ? Colors.warning : Colors.textSecondary }]}>
                        {stats.daysLeft === 0 ? 'Ends today' : `${stats.daysLeft}d left`}
                      </Text>
                      {budget.recurring && <Text style={s.recentMeta}>then resets</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Budget cards */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Your budgets</Text>
            {computed.map(({ budget, stats }, i) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                stats={stats}
                currency={currency}
                index={i}
                onPress={() => navigation.navigate('CreateCategoryBudgetModal', { budget })}
              />
            ))}
          </View>

          {/* Highest spending categories */}
          {topCategories.arr.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Top spending categories</Text>
              {topCategories.arr.map(({ id, amt, budgeted }) => {
                const cat = getCategoryById(id);
                const pct = topCategories.max > 0 ? (amt / topCategories.max) * 100 : 0;
                return (
                  <View key={id} style={s.topRow}>
                    <View style={[s.topIcon, { backgroundColor: cat.bg }]}>
                      <MaterialIcons name={cat.icon} size={16} color={cat.color} />
                    </View>
                    <View style={{ flex: 1, gap: 5 }}>
                      <View style={s.topTop}>
                        <Text style={s.recentTitle} numberOfLines={1}>{cat.label}</Text>
                        <Text style={[s.recentAmt, { color: cat.color }]}>{formatAmount(amt, currency)}</Text>
                      </View>
                      <ProgressBar pct={pct} color={cat.color} over={false} />
                    </View>
                    {budgeted ? (
                      <MaterialIcons name="check-circle" size={18} color={Colors.success} />
                    ) : (
                      <TouchableOpacity
                        style={s.topAddBtn}
                        onPress={() => navigation.navigate('CreateCategoryBudgetModal', { presetCategory: id })}
                      >
                        <MaterialIcons name="add" size={16} color={Colors.accent} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Recent expenses */}
          {recentExpenses.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Recently added</Text>
              {recentExpenses.map(t => {
                const cat = getCategoryById(t.category);
                return (
                  <View key={t.id} style={s.recentRow}>
                    <View style={[s.recentIcon, { backgroundColor: cat.bg }]}>
                      <MaterialIcons name={cat.icon} size={16} color={cat.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.recentTitle} numberOfLines={1}>{t.title}</Text>
                      <Text style={s.recentMeta}>{cat.label} · {formatDate(t.date)}</Text>
                    </View>
                    <Text style={s.recentAmt}>{formatAmount(t.amount, currency)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const get_styles = (Colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 120 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 54 : 20, paddingBottom: Spacing.base,
    borderBottomWidth: 1, borderBottomColor: Colors.divider, marginBottom: Spacing.base,
  },
  title: { fontFamily: Typography.bold, fontSize: 22, color: Colors.textPrimary },
  subtitle: { fontFamily: Typography.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', ...Shadow.accent },

  overview: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.card, gap: 14,
  },
  overviewRow: { flexDirection: 'row', alignItems: 'center' },
  vDivider: { width: 1, height: 34, backgroundColor: Colors.divider, marginHorizontal: 8 },
  overviewBarWrap: {},
  overviewMeta: { fontFamily: Typography.regular, fontSize: 11, color: Colors.textMuted },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.bg, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.divider },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusChipTxt: { fontFamily: Typography.medium, fontSize: 11, color: Colors.textSecondary },

  section: { marginHorizontal: Spacing.base, marginBottom: Spacing.base },
  sectionTitle: { fontFamily: Typography.semiBold, fontSize: 15, color: Colors.textPrimary, marginBottom: Spacing.md },

  alertRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.divider, borderLeftWidth: 3,
  },
  alertTxt: { flex: 1, fontFamily: Typography.regular, fontSize: 13, color: Colors.textSecondary },

  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.divider },
  recentIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recentTitle: { fontFamily: Typography.medium, fontSize: 13, color: Colors.textPrimary },
  recentMeta: { fontFamily: Typography.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  recentAmt: { fontFamily: Typography.monoBold, fontSize: 13, color: Colors.accent },

  expRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.divider },
  expIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expDaysWrap: { alignItems: 'flex-end' },
  expDays: { fontFamily: Typography.semiBold, fontSize: 12 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.divider },
  topIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  topTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topAddBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.accentMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.accentDim },

  empty: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.accentMuted, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  emptyTitle: { fontFamily: Typography.bold, fontSize: 18, color: Colors.textPrimary, marginBottom: 8 },
  emptyBody: { fontFamily: Typography.regular, fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: Spacing.lg },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.accent, borderRadius: Radius.xl, paddingVertical: 14, paddingHorizontal: 24, ...Shadow.accent },
  emptyBtnTxt: { fontFamily: Typography.bold, fontSize: 15, color: '#fff' },
});
