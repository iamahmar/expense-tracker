// screens/LayersScreen.jsx — Manage wallets ("layers")
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme, Typography, Spacing, Radius, Shadow } from '../theme';
import { useApp } from '../context/AppContext';
import { useLayers } from '../context/LayerContext';
import { formatAmount } from '../utils/helpers';

export default function LayersScreen({ navigation }) {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  const { allTransactions } = useApp();
  const { layers, activeLayer, switchLayer, removeLayer } = useLayers();

  const spentByLayer = useMemo(() => {
    const map = {};
    for (const t of allTransactions) {
      if (t.type !== 'expense') continue;
      const id = t.layerId ?? 'layer_default';
      map[id] = (map[id] ?? 0) + parseFloat(t.amount);
    }
    return map;
  }, [allTransactions]);

  const handleSelect = (layer) => {
    if (layer.id !== activeLayer?.id) {
      switchLayer(layer.id);
    }
  };

  const handleDelete = (layer) => {
    if (layers.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one wallet.');
      return;
    }
    Alert.alert(
      'Delete Wallet',
      `Delete "${layer.name}" and all its transactions? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeLayer(layer.id) },
      ]
    );
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallets</Text>
        <Text style={styles.headerSub}>Keep separate budgets for different areas of life</Text>
      </View>

      {layers.map(layer => {
        const isActive = layer.id === activeLayer?.id;
        const spent = spentByLayer[layer.id] ?? 0;

        return (
          <TouchableOpacity
            key={layer.id}
            style={[styles.card, isActive && { borderColor: layer.color + '66' }]}
            onPress={() => handleSelect(layer)}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconBadge, { backgroundColor: layer.color + '22' }]}>
                <MaterialIcons name={layer.icon} size={22} color={layer.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{layer.name}</Text>
                <Text style={styles.cardBudget}>
                  {formatAmount(spent, layer.currency)} spent this month
                </Text>
              </View>
              {isActive && (
                <View style={[styles.activeBadge, { backgroundColor: layer.color }]}>
                  <MaterialIcons name="check" size={14} color="#fff" />
                </View>
              )}
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('CreateLayerModal', { layer })}
              >
                <MaterialIcons name="edit" size={16} color={Colors.textSecondary} />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(layer)}>
                <MaterialIcons name="delete-outline" size={16} color={Colors.danger} />
                <Text style={[styles.actionText, { color: Colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('CreateLayerModal')}
      >
        <MaterialIcons name="add" size={20} color={Colors.accent} />
        <Text style={styles.addBtnText}>New Wallet</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const get_styles = (Colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: 120 },

  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: Spacing.lg,
  },
  headerTitle: { fontFamily: Typography.bold, fontSize: 26, color: Colors.textPrimary },
  headerSub: { fontFamily: Typography.regular, fontSize: 13, color: Colors.textSecondary, marginTop: 4 },

  card: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: Typography.semiBold, fontSize: 16, color: Colors.textPrimary },
  cardBudget: { fontFamily: Typography.regular, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  activeBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  barTrack: { height: 6, backgroundColor: Colors.divider, borderRadius: 3, overflow: 'hidden', marginTop: Spacing.md },
  barFill: { height: '100%', borderRadius: 3 },

  cardActions: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontFamily: Typography.medium, fontSize: 13, color: Colors.textSecondary },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing.base, marginTop: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.accentDim, borderStyle: 'dashed',
    borderRadius: Radius.xl, paddingVertical: 16,
  },
  addBtnText: { fontFamily: Typography.semiBold, fontSize: 15, color: Colors.accent },
});
