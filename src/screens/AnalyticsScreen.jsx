// screens/AnalyticsScreen.jsx
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Platform, Animated, Pressable,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  useTheme, Typography, Spacing, Radius, Shadow,
  getCategoryById, CATEGORIES, Animation,
} from '../theme';
import { useApp } from '../context/AppContext';
import {
  filterByMonth, getCategoryTotals, getDailyTotals,
  formatAmount, formatMonthYear,
} from '../utils/helpers';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - Spacing.base * 2;

const get_BAR_CONFIG = (Colors) => ({
  backgroundGradientFrom: Colors.surface,
  backgroundGradientTo: Colors.surface,
  backgroundGradientFromOpacity: 1,
  backgroundGradientToOpacity: 1,
  color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
  labelColor: () => Colors.textSecondary,
  strokeWidth: 2,
  barPercentage: 0.55,
  decimalPlaces: 0,
  propsForBackgroundLines: { stroke: Colors.divider, strokeDasharray: '4 4' },
});

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedAmount({ value, currency, style, prefix = '' }) {
  const Colors = useTheme();
  const ab = useMemo(() => get_ab(Colors), [Colors]);
  const sc = useMemo(() => get_sc(Colors), [Colors]);
  const ms = useMemo(() => get_ms(Colors), [Colors]);
  const cr = useMemo(() => get_cr(Colors), [Colors]);
  const ic = useMemo(() => get_ic(Colors), [Colors]);
  const sh = useMemo(() => get_sh(Colors), [Colors]);
  const s = useMemo(() => get_s(Colors), [Colors]);

  const anim   = useRef(new Animated.Value(0)).current;
  const [disp, setDisp] = useState(0);

  useEffect(() => {
    anim.stopAnimation();
    Animated.timing(anim, { toValue: value, duration: 700, useNativeDriver: false }).start();
    const id = anim.addListener(({ value: v }) => setDisp(Math.round(v)));
    return () => anim.removeListener(id);
  }, [value]);

  return (
    <Text style={style}>
      {prefix}{currency}{disp.toLocaleString()}
    </Text>
  );
}

// ─── Donut segment (SVG-free, pure RN View trick) ─────────────────────────────
// We build the donut as stacked arc slices using border-radius + rotation.
// For simplicity we render a custom horizontal legend + filled segments ring.
function DonutRing({ data, size = 160 }) {
  const Colors = useTheme();
  const ab = useMemo(() => get_ab(Colors), [Colors]);
  const sc = useMemo(() => get_sc(Colors), [Colors]);
  const ms = useMemo(() => get_ms(Colors), [Colors]);
  const cr = useMemo(() => get_cr(Colors), [Colors]);
  const ic = useMemo(() => get_ic(Colors), [Colors]);
  const sh = useMemo(() => get_sh(Colors), [Colors]);
  const s = useMemo(() => get_s(Colors), [Colors]);

  // data: [{ color, pct }]  pct 0-100
  const segments = useMemo(() => {
    const result = [];
    let cumulative = 0;
    data.forEach(d => {
      result.push({ ...d, start: cumulative });
      cumulative += d.pct;
    });
    return result;
  }, [data]);

  const ringAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(ringAnim, { toValue: 1, duration: 900, useNativeDriver: false }).start();
  }, [data.length]);

  const radius    = size / 2;
  const thickness = size * 0.18;
  const inner     = radius - thickness;

  // Build segments as rotated + clipped Views
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Track ring */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: radius,
        borderWidth: thickness,
        borderColor: Colors.dividerStrong,
      }} />

      {/* Segments — overlapping clip trick */}
      {segments.map((seg, i) => {
        const deg = (seg.pct / 100) * 360;
        return (
          <View
            key={i}
            style={{
              position: 'absolute', width: size, height: size,
              borderRadius: radius,
              borderWidth: thickness,
              borderColor: 'transparent',
              borderTopColor: seg.color,
              borderRightColor: deg > 90 ? seg.color : 'transparent',
              borderBottomColor: deg > 180 ? seg.color : 'transparent',
              borderLeftColor: deg > 270 ? seg.color : 'transparent',
              transform: [{ rotate: `${seg.start * 3.6}deg` }],
              opacity: 0.92,
            }}
          />
        );
      })}

      {/* Centre hole */}
      <View style={{
        position: 'absolute',
        top: thickness, left: thickness,
        width: inner * 2, height: inner * 2,
        borderRadius: inner,
        backgroundColor: Colors.surface,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <MaterialIcons name="pie-chart" size={20} color={Colors.textMuted} />
      </View>
    </View>
  );
}

// ─── Animated horizontal bar ──────────────────────────────────────────────────
function AnimBar({ pct, color, delay = 0 }) {
  const Colors = useTheme();
  const ab = useMemo(() => get_ab(Colors), [Colors]);
  const sc = useMemo(() => get_sc(Colors), [Colors]);
  const ms = useMemo(() => get_ms(Colors), [Colors]);
  const cr = useMemo(() => get_cr(Colors), [Colors]);
  const ic = useMemo(() => get_ic(Colors), [Colors]);
  const sh = useMemo(() => get_sh(Colors), [Colors]);
  const s = useMemo(() => get_s(Colors), [Colors]);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: pct,
      delay,
      ...Animation.springSmooth,
      useNativeDriver: false,
    }).start();
  }, [pct]);
  return (
    <View style={ab.track}>
      <Animated.View style={[ab.fill, {
        backgroundColor: color,
        width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }]} />
    </View>
  );
}
const get_ab = (Colors) => StyleSheet.create({
  track: { flex: 1, height: 5, backgroundColor: Colors.dividerStrong, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 3 },
});

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, currency, color, bg, index = 0 }) {
  const Colors = useTheme();
  const ab = useMemo(() => get_ab(Colors), [Colors]);
  const sc = useMemo(() => get_sc(Colors), [Colors]);
  const ms = useMemo(() => get_ms(Colors), [Colors]);
  const cr = useMemo(() => get_cr(Colors), [Colors]);
  const ic = useMemo(() => get_ic(Colors), [Colors]);
  const sh = useMemo(() => get_sh(Colors), [Colors]);
  const s = useMemo(() => get_s(Colors), [Colors]);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 80, useNativeDriver: true, ...Animation.springBouncy }).start();
  }, []);

  return (
    <Animated.View style={[sc.card, { backgroundColor: bg, opacity: anim, transform: [{ scale: anim }] }]}>
      <View style={[sc.iconWrap, { backgroundColor: color + '25' }]}>
        <MaterialIcons name={icon} size={16} color={color} />
      </View>
      <AnimatedAmount value={value} currency={currency} style={[sc.value, { color }]} />
      <Text style={sc.label}>{label}</Text>
    </Animated.View>
  );
}
const get_sc = (Colors) => StyleSheet.create({
  card:    { flex: 1, borderRadius: Radius.xl, padding: 14, gap: 5, borderWidth: 1, borderColor: Colors.divider },
  iconWrap:{ width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  value:   { fontFamily: Typography.monoBold, fontSize: 16, letterSpacing: -0.5 },
  label:   { fontFamily: Typography.regular, fontSize: 11, color: Colors.textSecondary },
});

// ─── Month selector ───────────────────────────────────────────────────────────
function MonthSelector({ month, onPrev, onNext, disableNext }) {
  const Colors = useTheme();
  const ab = useMemo(() => get_ab(Colors), [Colors]);
  const sc = useMemo(() => get_sc(Colors), [Colors]);
  const ms = useMemo(() => get_ms(Colors), [Colors]);
  const cr = useMemo(() => get_cr(Colors), [Colors]);
  const ic = useMemo(() => get_ic(Colors), [Colors]);
  const sh = useMemo(() => get_sh(Colors), [Colors]);
  const s = useMemo(() => get_s(Colors), [Colors]);

  return (
    <View style={ms.wrap}>
      <TouchableOpacity style={ms.btn} onPress={onPrev} activeOpacity={0.7}>
        <MaterialIcons name="chevron-left" size={20} color={Colors.textPrimary} />
      </TouchableOpacity>
      <View style={ms.center}>
        <MaterialIcons name="calendar-today" size={13} color={Colors.accent} />
        <Text style={ms.label}>{formatMonthYear(month)}</Text>
      </View>
      <TouchableOpacity
        style={[ms.btn, disableNext && { opacity: 0.3 }]}
        onPress={onNext}
        disabled={disableNext}
        activeOpacity={0.7}
      >
        <MaterialIcons name="chevron-right" size={20} color={Colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}
const get_ms = (Colors) => StyleSheet.create({
  wrap:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base, marginBottom: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.divider, padding: 4 },
  btn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  label:  { fontFamily: Typography.semiBold, fontSize: 14, color: Colors.textPrimary },
});

// ─── Category row ─────────────────────────────────────────────────────────────
function CategoryRow({ cat, amount, pct, rank, currency, index = 0 }) {
  const Colors = useTheme();
  const ab = useMemo(() => get_ab(Colors), [Colors]);
  const sc = useMemo(() => get_sc(Colors), [Colors]);
  const ms = useMemo(() => get_ms(Colors), [Colors]);
  const cr = useMemo(() => get_cr(Colors), [Colors]);
  const ic = useMemo(() => get_ic(Colors), [Colors]);
  const sh = useMemo(() => get_sh(Colors), [Colors]);
  const s = useMemo(() => get_s(Colors), [Colors]);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 60, useNativeDriver: true, ...Animation.springSmooth }).start();
  }, []);

  return (
    <Animated.View style={[cr.row, { opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      {rank != null && (
        <View style={cr.rank}>
          <Text style={cr.rankTxt}>{rank}</Text>
        </View>
      )}
      <View style={[cr.icon, { backgroundColor: cat.bg }]}>
        <MaterialIcons name={cat.icon} size={17} color={cat.color} />
      </View>
      <View style={cr.info}>
        <View style={cr.topRow}>
          <Text style={cr.name} numberOfLines={1}>{cat.label}</Text>
          <Text style={[cr.amount, { color: cat.color }]}>
            {formatAmount(amount, currency)}
          </Text>
        </View>
        <View style={cr.barRow}>
          <AnimBar pct={pct} color={cat.color} delay={index * 60 + 100} />
          <Text style={cr.pct}>{pct.toFixed(0)}%</Text>
        </View>
      </View>
    </Animated.View>
  );
}
const get_cr = (Colors) => StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.divider },
  rank:   { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.accentMuted, alignItems: 'center', justifyContent: 'center' },
  rankTxt:{ fontFamily: Typography.monoBold, fontSize: 10, color: Colors.accent },
  icon:   { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info:   { flex: 1, gap: 5 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:   { fontFamily: Typography.medium, fontSize: 13, color: Colors.textPrimary },
  amount: { fontFamily: Typography.monoBold, fontSize: 13 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pct:    { fontFamily: Typography.regular, fontSize: 10, color: Colors.textMuted, width: 28, textAlign: 'right' },
});

// ─── Insight card ─────────────────────────────────────────────────────────────
function InsightCard({ icon, color, title, body }) {
  const Colors = useTheme();
  const ab = useMemo(() => get_ab(Colors), [Colors]);
  const sc = useMemo(() => get_sc(Colors), [Colors]);
  const ms = useMemo(() => get_ms(Colors), [Colors]);
  const cr = useMemo(() => get_cr(Colors), [Colors]);
  const ic = useMemo(() => get_ic(Colors), [Colors]);
  const sh = useMemo(() => get_sh(Colors), [Colors]);
  const s = useMemo(() => get_s(Colors), [Colors]);

  return (
    <View style={[ic.card, { borderLeftColor: color }]}>
      <View style={[ic.iconWrap, { backgroundColor: color + '18' }]}>
        <MaterialIcons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ic.title}>{title}</Text>
        <Text style={ic.body}>{body}</Text>
      </View>
    </View>
  );
}
const get_ic = (Colors) => StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.divider, borderLeftWidth: 3 },
  iconWrap:{ width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  title:   { fontFamily: Typography.semiBold, fontSize: 13, color: Colors.textPrimary, marginBottom: 2 },
  body:    { fontFamily: Typography.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  const Colors = useTheme();
  const ab = useMemo(() => get_ab(Colors), [Colors]);
  const sc = useMemo(() => get_sc(Colors), [Colors]);
  const ms = useMemo(() => get_ms(Colors), [Colors]);
  const cr = useMemo(() => get_cr(Colors), [Colors]);
  const ic = useMemo(() => get_ic(Colors), [Colors]);
  const sh = useMemo(() => get_sh(Colors), [Colors]);
  const s = useMemo(() => get_s(Colors), [Colors]);

  return (
    <View style={sh.wrap}>
      <Text style={sh.title}>{title}</Text>
      {subtitle && <Text style={sh.sub}>{subtitle}</Text>}
    </View>
  );
}
const get_sh = (Colors) => StyleSheet.create({
  wrap:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Spacing.md },
  title: { fontFamily: Typography.semiBold, fontSize: 15, color: Colors.textPrimary },
  sub:   { fontFamily: Typography.regular, fontSize: 12, color: Colors.textMuted },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const Colors = useTheme();
  const ab = useMemo(() => get_ab(Colors), [Colors]);
  const sc = useMemo(() => get_sc(Colors), [Colors]);
  const ms = useMemo(() => get_ms(Colors), [Colors]);
  const cr = useMemo(() => get_cr(Colors), [Colors]);
  const ic = useMemo(() => get_ic(Colors), [Colors]);
  const sh = useMemo(() => get_sh(Colors), [Colors]);
  const s = useMemo(() => get_s(Colors), [Colors]);

  const { transactions, settings } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthTxns = useMemo(() =>
    filterByMonth(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  const categoryTotals = useMemo(() => getCategoryTotals(monthTxns), [monthTxns]);
  const dailyTotals    = useMemo(() => getDailyTotals(transactions, selectedMonth), [transactions, selectedMonth]);

  const totalExpense = useMemo(() =>
    Object.values(categoryTotals).reduce((s, v) => s + v, 0), [categoryTotals]);

  const totalIncome = useMemo(() =>
    monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0),
    [monthTxns]);

  const avgDaily = useMemo(() => {
    const days = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    return totalExpense / days;
  }, [totalExpense, selectedMonth]);

  const txnCount = monthTxns.filter(t => t.type === 'expense').length;

  // Sorted categories
  const sortedCats = useMemo(() =>
    Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([id, amount]) => ({
        cat: getCategoryById(id),
        amount,
        pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      })),
    [categoryTotals, totalExpense]
  );

  // Donut data
  const donutData = useMemo(() =>
    sortedCats.slice(0, 6).map(({ cat, pct }) => ({ color: cat.color, pct })),
    [sortedCats]
  );

  // Weekly bar data
  const barData = useMemo(() => {
    const weeks = [0, 0, 0, 0];
    dailyTotals.forEach((v, i) => { weeks[Math.min(Math.floor(i / 7), 3)] += v; });
    return {
      labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
      datasets: [{ data: weeks.map(v => Math.round(v)) }],
    };
  }, [dailyTotals]);

  // Smart insights
  const insights = useMemo(() => {
    const list = [];
    if (sortedCats.length > 0) {
      const top = sortedCats[0];
      list.push({
        icon: 'trending-up',
        color: top.cat.color,
        title: `${top.cat.label} is your top expense`,
        body: `${top.pct.toFixed(0)}% of this month's spending — ${formatAmount(top.amount, settings.currency)}`,
      });
    }
    if (totalIncome > 0 && totalExpense > totalIncome) {
      list.push({
        icon: 'warning',
        color: Colors.warning,
        title: 'Spending exceeds income',
        body: `You've spent ${formatAmount(totalExpense - totalIncome, settings.currency)} more than you earned this month.`,
      });
    } else if (totalIncome > 0) {
      const saved = totalIncome - totalExpense;
      list.push({
        icon: 'savings',
        color: Colors.success,
        title: 'Great job saving!',
        body: `You've kept ${formatAmount(saved, settings.currency)} (${((saved / totalIncome) * 100).toFixed(0)}% of income) this month.`,
      });
    }
    if (avgDaily > 0) {
      list.push({
        icon: 'today',
        color: Colors.info,
        title: `${formatAmount(avgDaily, settings.currency)}/day average`,
        body: `Across ${txnCount} expense transaction${txnCount !== 1 ? 's' : ''} this month.`,
      });
    }
    return list;
  }, [sortedCats, totalIncome, totalExpense, avgDaily, txnCount]);

  const changeMonth = (delta) => {
    setSelectedMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedMonth.getMonth() === now.getMonth() &&
           selectedMonth.getFullYear() === now.getFullYear();
  }, [selectedMonth]);

  const isEmpty = sortedCats.length === 0;

  return (
    <ScrollView
      style={s.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.scroll}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Analytics</Text>
          <Text style={s.subtitle}>Your spending at a glance</Text>
        </View>
        <View style={s.headerBadge}>
          <MaterialIcons name="insights" size={16} color={Colors.accent} />
          <Text style={s.headerBadgeTxt}>{monthTxns.length} txns</Text>
        </View>
      </View>

      {/* Month selector */}
      <MonthSelector
        month={selectedMonth}
        onPrev={() => changeMonth(-1)}
        onNext={() => changeMonth(1)}
        disableNext={isCurrentMonth}
      />

      {/* Stat cards */}
      <View style={s.statRow}>
        <StatCard
          icon="arrow-upward"
          label="Expenses"
          value={totalExpense}
          currency={settings.currency}
          color={Colors.accent}
          bg={Colors.expenseLight}
          index={0}
        />
        <View style={{ width: 10 }} />
        <StatCard
          icon="arrow-downward"
          label="Income"
          value={totalIncome}
          currency={settings.currency}
          color={Colors.income}
          bg={Colors.incomeLight}
          index={1}
        />
        <View style={{ width: 10 }} />
        <StatCard
          icon="receipt-long"
          label="Transactions"
          value={txnCount}
          currency=""
          color={Colors.info}
          bg={Colors.infoLight}
          index={2}
        />
      </View>

      {/* Insights */}
      {insights.length > 0 && (
        <View style={s.section}>
          <SectionHeader title="Insights" subtitle={`${insights.length} this month`} />
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </View>
      )}

      {/* Category breakdown — donut + legend */}
      <View style={[s.card, s.section]}>
        <SectionHeader title="Spending by Category" />
        {isEmpty ? (
          <View style={s.empty}>
            <MaterialIcons name="pie-chart-outline" size={38} color={Colors.textMuted} />
            <Text style={s.emptyTxt}>No expenses this month</Text>
          </View>
        ) : (
          <>
            {/* Donut + top legend side by side */}
            <View style={s.donutRow}>
              <DonutRing data={donutData} size={150} />
              <View style={s.donutLegend}>
                {sortedCats.slice(0, 5).map(({ cat, amount, pct }) => (
                  <View key={cat.id} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={s.legendName} numberOfLines={1}>{cat.shortLabel || cat.label}</Text>
                    <Text style={[s.legendPct, { color: cat.color }]}>{pct.toFixed(0)}%</Text>
                  </View>
                ))}
                {sortedCats.length > 5 && (
                  <Text style={s.moreText}>+{sortedCats.length - 5} more</Text>
                )}
              </View>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLbl}>Total spent</Text>
              <Text style={s.totalAmt}>{formatAmount(totalExpense, settings.currency)}</Text>
            </View>
          </>
        )}
      </View>

      {/* Top categories ranked */}
      {!isEmpty && (
        <View style={s.section}>
          <SectionHeader title="Category Ranking" subtitle="by spend" />
          {sortedCats.map(({ cat, amount, pct }, i) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              amount={amount}
              pct={pct}
              rank={i + 1}
              currency={settings.currency}
              index={i}
            />
          ))}
        </View>
      )}

      {/* Weekly bar chart */}
      <View style={[s.card, s.section]}>
        <SectionHeader title="Weekly Spending" subtitle="this month" />
        {barData.datasets[0].data.every(v => v === 0) ? (
          <View style={s.empty}>
            <MaterialIcons name="bar-chart" size={38} color={Colors.textMuted} />
            <Text style={s.emptyTxt}>No data yet</Text>
          </View>
        ) : (
          <BarChart
            data={barData}
            width={CHART_W - Spacing.xl * 2}
            height={170}
            chartConfig={get_BAR_CONFIG(Colors)}
            style={{ borderRadius: Radius.md, marginTop: 4 }}
            showValuesOnTopOfBars
            fromZero
            withInnerLines
            yAxisLabel={settings.currency}
            yAxisSuffix=""
            flatColor
          />
        )}
      </View>

      {/* Savings rate card */}
      {totalIncome > 0 && (
        <View style={[s.card, s.section]}>
          <SectionHeader title="Savings Rate" />
          <View style={s.savingsRow}>
            <View style={s.savingsLeft}>
              {(() => {
                const rate = ((totalIncome - totalExpense) / totalIncome) * 100;
                const clamped = Math.max(0, Math.min(100, rate));
                const isGood  = rate >= 20;
                return (
                  <>
                    <Text style={[s.savingsPct, { color: isGood ? Colors.success : Colors.warning }]}>
                      {rate >= 0 ? rate.toFixed(0) : '0'}%
                    </Text>
                    <Text style={s.savingsLbl}>saved this month</Text>
                    <View style={s.savingsBarTrack}>
                      <SavingsBar pct={clamped} isGood={isGood} />
                    </View>
                  </>
                );
              })()}
            </View>
            <View style={s.savingsDivider} />
            <View style={s.savingsRight}>
              <SavingsStat label="Earned" value={formatAmount(totalIncome, settings.currency)}   color={Colors.income} />
              <SavingsStat label="Spent"  value={formatAmount(totalExpense, settings.currency)}  color={Colors.accent} />
              <SavingsStat
                label="Saved"
                value={formatAmount(Math.max(0, totalIncome - totalExpense), settings.currency)}
                color={Colors.success}
              />
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SavingsBar({ pct, isGood }) {
  const Colors = useTheme();
  const ab = useMemo(() => get_ab(Colors), [Colors]);
  const sc = useMemo(() => get_sc(Colors), [Colors]);
  const ms = useMemo(() => get_ms(Colors), [Colors]);
  const cr = useMemo(() => get_cr(Colors), [Colors]);
  const ic = useMemo(() => get_ic(Colors), [Colors]);
  const sh = useMemo(() => get_sh(Colors), [Colors]);
  const s = useMemo(() => get_s(Colors), [Colors]);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: pct, delay: 400, ...Animation.springSmooth, useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={{ height: 6, backgroundColor: Colors.dividerStrong, borderRadius: 3, overflow: 'hidden', marginTop: 10 }}>
      <Animated.View style={{
        height: '100%', borderRadius: 3,
        backgroundColor: isGood ? Colors.success : Colors.warning,
        width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }} />
    </View>
  );
}

function SavingsStat({ label, value, color }) {
  const Colors = useTheme();
  const ab = useMemo(() => get_ab(Colors), [Colors]);
  const sc = useMemo(() => get_sc(Colors), [Colors]);
  const ms = useMemo(() => get_ms(Colors), [Colors]);
  const cr = useMemo(() => get_cr(Colors), [Colors]);
  const ic = useMemo(() => get_ic(Colors), [Colors]);
  const sh = useMemo(() => get_sh(Colors), [Colors]);
  const s = useMemo(() => get_s(Colors), [Colors]);

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontFamily: Typography.regular, fontSize: 11, color: Colors.textMuted }}>{label}</Text>
      <Text style={{ fontFamily: Typography.monoBold, fontSize: 14, color }}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const get_s = (Colors) => StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 120 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: Spacing.base,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    marginBottom: Spacing.base,
  },
  title:    { fontFamily: Typography.bold, fontSize: 22, color: Colors.textPrimary },
  subtitle: { fontFamily: Typography.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accentMuted, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.accentDim },
  headerBadgeTxt: { fontFamily: Typography.medium, fontSize: 12, color: Colors.accent },

  statRow: { flexDirection: 'row', marginHorizontal: Spacing.base, marginBottom: Spacing.base },

  section: { marginHorizontal: Spacing.base, marginBottom: Spacing.base },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.cardBorder,
    ...Shadow.card,
  },

  // Donut
  donutRow:    { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  donutLegend: { flex: 1, gap: 7 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendName:  { flex: 1, fontFamily: Typography.regular, fontSize: 12, color: Colors.textSecondary },
  legendPct:   { fontFamily: Typography.monoBold, fontSize: 12 },
  moreText:    { fontFamily: Typography.regular, fontSize: 11, color: Colors.textMuted },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderColor: Colors.divider },
  totalLbl:    { fontFamily: Typography.regular, fontSize: 13, color: Colors.textSecondary },
  totalAmt:    { fontFamily: Typography.monoBold, fontSize: 16, color: Colors.textPrimary },

  // Savings
  savingsRow:   { flexDirection: 'row', gap: 16 },
  savingsLeft:  { flex: 1 },
  savingsPct:   { fontFamily: Typography.mono, fontSize: 36, letterSpacing: -1 },
  savingsLbl:   { fontFamily: Typography.regular, fontSize: 12, color: Colors.textSecondary },
  savingsBarTrack: { marginTop: 2 },
  savingsDivider: { width: 1, backgroundColor: Colors.divider },
  savingsRight: { flex: 1, justifyContent: 'center', paddingLeft: 8 },

  empty:    { alignItems: 'center', paddingVertical: 36 },
  emptyTxt: { fontFamily: Typography.regular, fontSize: 14, color: Colors.textMuted, marginTop: 10 },
});