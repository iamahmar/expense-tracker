// screens/TransactionDetailScreen.jsx
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Platform, ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme, Typography, Spacing, Radius, Shadow, getCategoryById } from '../theme';
import { useApp } from '../context/AppContext';
import { formatAmountFull, formatDate } from '../utils/helpers';

export default function TransactionDetailScreen({ route, navigation }) {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  const routeTxn = route.params.transaction;
  const { transactions, deleteTransaction, settings } = useApp();

  // Find live transaction so it updates automatically when edited
  const transaction = transactions.find(t => t.id === routeTxn.id) || routeTxn;

  const cat      = getCategoryById(transaction.category);
  const isIncome = transaction.type === 'income';

  const handleDelete = () => {
    Alert.alert('Delete Transaction', `Remove "${transaction.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteTransaction(transaction.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('AddExpenseModal', { transaction })} style={styles.editBtn}>
            <MaterialIcons name="edit" size={22} color={Colors.info} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <MaterialIcons name="delete-outline" size={22} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Amount Hero */}
        <View style={styles.amountHero}>
          <View style={[styles.heroIcon, { backgroundColor: cat.bg }]}>
            <MaterialIcons name={cat.icon} size={36} color={cat.color} />
          </View>
          <Text style={[styles.heroAmount, { color: isIncome ? Colors.income : Colors.accent }]}>
            {isIncome ? '+' : '-'}{formatAmountFull(transaction.amount, settings.currency)}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: isIncome ? Colors.incomeLight : Colors.expenseLight }]}>
            <Text style={[styles.typeBadgeText, { color: isIncome ? Colors.income : Colors.accent }]}>
              {isIncome ? '↓ Income' : '↑ Expense'}
            </Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <DetailRow icon="edit" label="Title" value={transaction.title} />
          <DetailRow icon={cat.icon} label="Category" value={cat.label} color={cat.color} />
          <DetailRow icon="event" label="Date" value={formatDate(transaction.date)} />
          <DetailRow icon="schedule" label="Added" value={new Date(transaction.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
          <DetailRow icon="tag" label="ID" value={transaction.id} mono small />
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, color, mono, small }) {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  return (
    <View style={styles.detailRow}>
      <MaterialIcons name={icon} size={16} color={color || Colors.textMuted} style={styles.detailIcon} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[
          styles.detailValue,
          mono && { fontFamily: Typography.mono, fontSize: small ? 11 : 14 },
          color && { color },
          small && { fontSize: 11 },
        ]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const get_styles = (Colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

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
  headerActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.infoLight, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: Typography.bold, fontSize: 18, color: Colors.textPrimary },

  content: { padding: Spacing.base, paddingBottom: 120 },

  amountHero: { alignItems: 'center', paddingVertical: Spacing.xxl },
  heroIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  heroAmount: { fontFamily: Typography.mono, fontSize: 40, marginBottom: Spacing.md, letterSpacing: -1 },
  typeBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.full },
  typeBadgeText: { fontFamily: Typography.semiBold, fontSize: 14 },

  detailsCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  detailIcon: { marginRight: Spacing.md },
  detailContent: { flex: 1 },
  detailLabel: { fontFamily: Typography.regular, fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  detailValue: { fontFamily: Typography.medium, fontSize: 15, color: Colors.textPrimary },
});
