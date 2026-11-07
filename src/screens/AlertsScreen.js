import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert as RNAlert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AlertCard } from '../components/AlertCard';
import { useGait } from '../context/GaitContext';
import { COLORS, SHADOWS } from '../utils/constants';

const FILTER_ITEMS = [
  { id: 'all', label: 'All', count: 3 },
  { id: 'shuffle', label: 'Shuffling', count: 1 },
  { id: 'limp', label: 'Limping', count: 1 },
  { id: 'unsteady', label: 'Unsteady', count: 1 },
  { id: 'toe_walk', label: 'Toe Walk', count: 0 },
];

export default function AlertsScreen({ navigation }) {
  const { alerts, dismissAlert, markAllAlertsRead } = useGait ? useGait() : {};
  const [activeFilter, setActiveFilter] = useState('all');

  const alertList = alerts && alerts.length > 0 ? alerts : [
    {
      id: 'alert-1',
      ts: Date.now() - 1000 * 60 * 35,
      title: 'Shuffling Stride Episode Detected',
      class: 'shuffle',
      side: 'Both Feet',
      conf: 0.94,
      description: "Low ground clearance and dragging detected during 35 consecutive steps — characteristic of Parkinsonian festination.",
      severity: 'danger',
    },
    {
      id: 'alert-2',
      ts: Date.now() - 1000 * 60 * 60 * 18,
      title: 'Lateral Sway & Balance Instability',
      class: 'unsteady',
      side: 'Left Foot',
      conf: 0.89,
      description: 'Elevated mediolateral center-of-pressure variance. Fall risk index increased to Moderate (0.42).',
      severity: 'warning',
    },
    {
      id: 'alert-3',
      ts: Date.now() - 1000 * 60 * 60 * 42,
      title: 'Antalgic Limp Asymmetry',
      class: 'limp',
      side: 'Right Foot',
      conf: 0.91,
      description: 'Right limb single-support phase reduced by 24% relative to contralateral limb, indicating antalgic offloading.',
      severity: 'danger',
    },
  ];

  const filteredAlerts = alertList.filter((a) => {
    if (activeFilter === 'all') return true;
    const cls = (a.class || a.title || '').toLowerCase();
    return cls.includes(activeFilter.toLowerCase());
  });

  const handleClearAll = () => {
    if (markAllAlertsRead) markAllAlertsRead();
    RNAlert.alert('Alerts Acknowledged', 'All active anomalies marked as reviewed.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FF" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.navigate('BLEScan')}>
          <MaterialCommunityIcons name="bluetooth-settings" size={24} color="#0058BD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gait Anomaly Center</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleClearAll}>
          <MaterialCommunityIcons name="check-all" size={22} color="#0058BD" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Fall Risk Status Banner */}
        <View style={styles.riskBanner}>
          <View style={styles.riskLeft}>
            <View style={styles.riskIconBox}>
              <MaterialCommunityIcons name="shield-alert" size={22} color="#BA1A1A" />
            </View>
            <View>
              <Text style={styles.riskTitle}>Fall Risk Level: Moderate</Text>
              <Text style={styles.riskSub}>3 gait abnormalities flagged in the last 48 hours</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.doctorNotifyBtn}
            onPress={() => navigation?.navigate('Profile')}
          >
            <Text style={styles.doctorNotifyText}>Doctor Log</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips Horizontal Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTER_ITEMS.map((chip) => {
            const isSelected = activeFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setActiveFilter(chip.id)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {chip.label}
                </Text>
                <View style={[styles.chipCountBadge, isSelected && styles.chipCountBadgeActive]}>
                  <Text style={[styles.chipCountText, isSelected && styles.chipCountTextActive]}>
                    {chip.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Alerts List */}
        <View style={styles.alertsList}>
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <MaterialCommunityIcons name="check-decagram" size={48} color="#006E28" />
              <Text style={styles.emptyTitle}>No Anomalies Detected</Text>
              <Text style={styles.emptySub}>
                Your gait biomechanics are stable and within healthy therapeutic thresholds.
              </Text>
            </View>
          ) : (
            filteredAlerts.map((item) => (
              <AlertCard
                key={item.id}
                alert={item}
                onDismiss={dismissAlert}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8F3',
    ...SHADOWS.soft,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '800',
    color: '#0058BD',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 14,
  },
  riskBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    ...SHADOWS.soft,
  },
  riskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  riskIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFDAD6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  riskSub: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#B91C1C',
    marginTop: 1,
  },
  doctorNotifyBtn: {
    backgroundColor: '#BA1A1A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doctorNotifyText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filtersRow: {
    gap: 8,
    paddingBottom: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E2ED',
    gap: 6,
    ...SHADOWS.soft,
  },
  filterChipActive: {
    backgroundColor: '#0058BD',
    borderColor: '#0058BD',
  },
  filterChipText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#414755',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  chipCountBadge: {
    backgroundColor: '#F1F3FE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  chipCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  chipCountText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#0058BD',
  },
  chipCountTextActive: {
    color: '#FFFFFF',
  },
  alertsList: {
    gap: 12,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6E8F3',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#181B23',
  },
  emptySub: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#717786',
    textAlign: 'center',
    maxWidth: 260,
  },
});
