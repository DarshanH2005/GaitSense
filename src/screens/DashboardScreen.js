import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBanner } from '../components/StatusBanner';
import { StatCard } from '../components/StatCard';
import { PressureHeatmap } from '../components/PressureHeatmap';
import { useGait } from '../context/GaitContext';
import { useBLE } from '../context/BLEContext';
import { formatNumber, formatTime } from '../utils/formatters';
import { COLORS, SHADOWS } from '../utils/constants';

export default function DashboardScreen({ navigation }) {
  const {
    latestLeft,
    latestRight,
    todayStats,
    sessionDuration,
    refreshHistory,
    calibrateSensors,
  } = useGait ? useGait() : {};

  const { isDemoMode, leftStatus, rightStatus } = useBLE ? useBLE() : {};
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    if (refreshHistory) await refreshHistory();
    if (calibrateSensors) await calibrateSensors();
    setTimeout(() => setRefreshing(false), 700);
  };

  // Derive active live metrics
  const steps = todayStats?.totalSteps ?? 0;
  const symmetry = todayStats?.symmetryScore ?? null;
  const classification = todayStats?.dominantClass || 'unknown';
  const confidence = 0;
  const activeSeconds = sessionDuration ?? 0;
  const cadence = null;

  const handleTare = async () => {
    try { if (calibrateSensors) await calibrateSensors(); Alert.alert('Tare command sent', 'Keep both insoles unloaded. Calibration is confirmed only when fresh telemetry reports calibrated.'); }
    catch (e) { Alert.alert('Unable to tare', e.message); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FF" />

      {/* Modern Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeftBtn}
          onPress={() => navigation?.navigate('BLEScan')}
        >
          <View style={styles.insoleBatteryPills}>
            <View style={styles.batteryPill}>
              <Text style={styles.batteryPillText}>L</Text>
              <Text style={styles.batteryPercent}>{leftStatus === 'connected' ? 'live' : 'off'}</Text>
            </View>
            <View style={styles.batteryPill}>
              <Text style={styles.batteryPillText}>R</Text>
              <Text style={styles.batteryPercent}>{rightStatus === 'connected' ? 'live' : 'off'}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>GaitSense</Text>
          <View style={styles.liveStreamChip}>
            <View style={styles.liveDot} />
              <Text style={styles.liveStreamText}>{isDemoMode ? 'SIMULATION' : (leftStatus === 'connected' || rightStatus === 'connected' ? 'LIVE TELEMETRY' : 'NOT CONNECTED')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerRightBtn}
          onPress={() => navigation?.navigate('LiveView')}
        >
          <MaterialCommunityIcons name="motion-sensor" size={24} color="#0058BD" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0058BD']}
            tintColor="#0058BD"
          />
        }
      >
        {/* Master Circular Gait Health Gauge */}
        <StatusBanner
          gaitClass={classification}
          confidence={confidence}
          cadence={cadence}
          symmetry={symmetry}
          side="Bilateral Stride"
        />

        {/* 4-Card Bento Biomarker Grid */}
        <View style={styles.bentoGrid}>
          {/* Card 1: Steps Today */}
          <View style={styles.bentoCol}>
            <StatCard
              title="Daily Steps"
              value={formatNumber(steps)}
              subtitle="Goal: 6,000"
              icon="shoe-print"
              color="#0058BD"
              trend="+14%"
              progress={steps / 6000}
              onPress={() => navigation?.navigate('History')}
            />
          </View>

          {/* Card 2: Bilateral Symmetry */}
          <View style={styles.bentoCol}>
            <StatCard
              title="Bilateral Symmetry"
              value={symmetry == null ? '—' : `${Math.round(symmetry)}%`}
              subtitle="Step-count balance"
              icon="scale-balance"
              color="#006E28"
              trend="+2.4%"
              accentTop={true}
              progress={symmetry == null ? 0 : symmetry / 100}
              onPress={() => navigation?.navigate('History')}
            />
          </View>

          {/* Card 3: Session Active Time */}
          <View style={styles.bentoCol}>
            <StatCard
              title="Active Duration"
              value={formatTime(activeSeconds)}
              subtitle="Continuous walk"
              icon="timer-outline"
              color="#5856D6"
              trend="Nominal"
            />
          </View>

          {/* Card 4: Stride Cadence */}
          <View style={styles.bentoCol}>
            <StatCard
              title="Gait Cadence"
              value={cadence == null ? '—' : cadence}
              unit="spm"
              subtitle="Not calculated"
              icon="speedometer"
              color="#FF9500"
              trend="Unavailable"
              onPress={() => navigation?.navigate('LiveView')}
            />
          </View>
        </View>

        {/* Quick Action Navigation Bar */}
        <View style={styles.quickActionsBar}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation?.navigate('LiveView')}
          >
            <MaterialCommunityIcons name="waveform" size={18} color="#0058BD" />
            <Text style={styles.actionBtnText}>Oscilloscope</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation?.navigate('Alerts')}
          >
            <MaterialCommunityIcons name="bell-alert-outline" size={18} color="#BA1A1A" />
            <Text style={styles.actionBtnText}>Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleTare}
          >
            <MaterialCommunityIcons name="target" size={18} color="#006E28" />
            <Text style={styles.actionBtnText}>Zero-Tare</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation?.navigate('Profile')}
          >
            <MaterialCommunityIcons name="file-chart-outline" size={18} color="#5856D6" />
            <Text style={styles.actionBtnText}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* Plantar Force Heatmap Matrix */}
        <PressureHeatmap
          latestLeft={latestLeft}
          latestRight={latestRight}
          leftStatus={leftStatus}
          rightStatus={rightStatus}
          onFootPress={() => navigation?.navigate('LiveView')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9FF',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8F3',
    ...SHADOWS.soft,
  },
  headerLeftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insoleBatteryPills: {
    flexDirection: 'row',
    gap: 6,
  },
  batteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3FE',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E2ED',
    gap: 3,
  },
  batteryPillText: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '800',
    color: '#0058BD',
  },
  batteryPercent: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: '#181B23',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '800',
    color: '#0058BD',
    letterSpacing: -0.3,
  },
  liveStreamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#006E28',
  },
  liveStreamText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: '#006E28',
    letterSpacing: 0.5,
  },
  headerRightBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F3FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 14,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bentoCol: {
    width: '48.5%',
  },
  quickActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECEEF9',
    ...SHADOWS.soft,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: '#414755',
  },
});
