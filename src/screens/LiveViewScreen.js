import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FootDiagram } from '../components/FootDiagram';
import { GaitChart } from '../components/GaitChart';
import { useGait } from '../context/GaitContext';
import { useBLE } from '../context/BLEContext';
import { COLORS, SHADOWS } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LiveViewScreen({ navigation }) {
  const { latestLeft, latestRight, recentHistory } = useGait ? useGait() : {};
  const { isDemoMode, leftStatus, rightStatus } = useBLE ? useBLE() : {};

  const [selectedFoot, setSelectedFoot] = useState('both'); // 'left' | 'both' | 'right'
  const [chartMode, setChartMode] = useState('pressure'); // 'pressure' | 'motion'
  const [isPaused, setIsPaused] = useState(false);
  const [frozen, setFrozen] = useState(null);
  useEffect(() => { if (!isPaused) setFrozen(null); }, [isPaused]);
  const shownLeft = isPaused ? frozen?.left : latestLeft;
  const shownRight = isPaused ? frozen?.right : latestRight;
  const shownHistory = isPaused ? frozen?.history || [] : recentHistory;
  const togglePause = () => { if (!isPaused) setFrozen({ left: latestLeft, right: latestRight, history: recentHistory }); setIsPaused(value => !value); };

  const leftFsr = shownLeft?.fsr || [0, 0, 0, 0];
  const rightFsr = shownRight?.fsr || [0, 0, 0, 0];

  // Kinematics calculations
  const cadence = null;
  const contactTime = null;
  const stanceRatio = null;
  const swingRatio = null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FF" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.goBack?.()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0058BD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Biomechanics Lab</Text>
        <TouchableOpacity
          style={[styles.pauseBtn, isPaused && styles.pauseBtnActive]}
          onPress={togglePause}
        >
          <MaterialCommunityIcons
            name={isPaused ? "play" : "pause"}
            size={20}
            color={isPaused ? "#FFFFFF" : "#0058BD"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Telemetry Stream Diagnostics HUD */}
        <View style={styles.telemetryHud}>
          <View style={styles.hudLeft}>
            <View style={[styles.liveDot, isPaused && { backgroundColor: '#FF9500' }]} />
            <Text style={styles.hudStreamStatus}>
              {isPaused ? 'DISPLAY PAUSED' : (leftStatus === 'connected' || rightStatus === 'connected' ? 'STREAMING TELEMETRY' : 'NO FRESH TELEMETRY')}
            </Text>
          </View>
          <View style={styles.hudStatsRow}>
            <View style={styles.hudStatItem}>
              <MaterialCommunityIcons name="lightning-bolt" size={13} color="#53E16F" />
              <Text style={styles.hudStat}>{isDemoMode ? 'demo' : 'rate unavailable'}</Text>
            </View>
            <View style={styles.hudStatItem}>
              <MaterialCommunityIcons name="signal" size={12} color="#64D2FF" />
              <Text style={styles.hudStat}>RSSI unavailable</Text>
            </View>
            <View style={styles.hudStatItem}>
              <MaterialCommunityIcons name="clock-fast" size={13} color="#FFB874" />
              <Text style={styles.hudStat}>latency unavailable</Text>
            </View>
          </View>
        </View>

        {/* View Switcher Controls */}
        <View style={styles.viewControlsWrapper}>
          <View style={styles.viewPill}>
            <TouchableOpacity
              style={[styles.viewTabBtn, selectedFoot === 'left' && styles.viewTabBtnActive]}
              onPress={() => setSelectedFoot('left')}
            >
              <Text style={[styles.viewTabBtnText, selectedFoot === 'left' && styles.viewTabBtnTextActive]}>
                Left Sole
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewTabBtn, selectedFoot === 'both' && styles.viewTabBtnActive]}
              onPress={() => setSelectedFoot('both')}
            >
              <Text style={[styles.viewTabBtnText, selectedFoot === 'both' && styles.viewTabBtnTextActive]}>
                Bilateral (Both)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewTabBtn, selectedFoot === 'right' && styles.viewTabBtnActive]}
              onPress={() => setSelectedFoot('right')}
            >
              <Text style={[styles.viewTabBtnText, selectedFoot === 'right' && styles.viewTabBtnTextActive]}>
                Right Sole
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plantar Silhouette Force Heatmap Canvas */}
        <View style={styles.heatmapCard}>
          <View style={styles.heatmapHeader}>
            <View>
              <Text style={styles.cardTitle}>Plantar Pressure Distribution</Text>
              <Text style={styles.cardSubtitle}>Real-time Center of Pressure (COP) Vector</Text>
            </View>
            <View style={styles.copBadge}>
              <Text style={styles.copBadgeText}>COP Active</Text>
            </View>
          </View>

          <View style={styles.feetCanvas}>
            {(selectedFoot === 'left' || selectedFoot === 'both') && (
              <FootDiagram
                side="L"
                fsrValues={leftFsr}
                size={selectedFoot === 'both' ? 145 : 180}
                showLabels={true}
                showCOP={true}
              />
            )}
            {(selectedFoot === 'right' || selectedFoot === 'both') && (
              <FootDiagram
                side="R"
                fsrValues={rightFsr}
                size={selectedFoot === 'both' ? 145 : 180}
                showLabels={true}
                showCOP={true}
              />
            )}
          </View>

          {/* Stance vs Swing Phase Cycle Visualizer */}
          <View style={styles.gaitPhaseContainer}>
            <View style={styles.phaseHeader}>
              <Text style={styles.phaseTitle}>Gait Cycle Phase Ratio</Text>
              <Text style={styles.phaseValues}>Not calculated</Text>
            </View>
            <Text style={styles.cardSubtitle}>Phase segmentation has not been implemented.</Text>
            <View style={styles.phaseStepsRow}>
              <Text style={styles.phaseStep}>1. Heel Strike</Text>
              <Text style={styles.phaseStep}>2. Loading</Text>
              <Text style={styles.phaseStep}>3. Mid Stance</Text>
              <Text style={styles.phaseStep}>4. Toe-Off</Text>
            </View>
          </View>
        </View>

        {/* Live Multi-Channel Oscilloscope */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.cardTitle}>Telemetry Waveform Stream</Text>
              <Text style={styles.cardSubtitle}>Multi-channel high frequency response</Text>
            </View>

            {/* Mode Switcher: FSR vs IMU */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, chartMode === 'pressure' && styles.modeBtnActive]}
                onPress={() => setChartMode('pressure')}
              >
                <Text style={[styles.modeBtnText, chartMode === 'pressure' && styles.modeBtnTextActive]}>
                  Force (FSR)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, chartMode === 'motion' && styles.modeBtnActive]}
                onPress={() => setChartMode('motion')}
              >
                <Text style={[styles.modeBtnText, chartMode === 'motion' && styles.modeBtnTextActive]}>
                  Motion (IMU)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <GaitChart
            data={shownHistory}
            mode={chartMode}
            side={selectedFoot === 'right' ? 'R' : selectedFoot === 'left' ? 'L' : 'both'}
            height={170}
          />
        </View>

        {/* Kinematics HUD Metrics Grid */}
        <View style={styles.hudGrid}>
          <View style={styles.hudCard}>
            <Text style={styles.hudCardLabel}>CADENCE</Text>
            <Text style={styles.hudCardValue}>—</Text>
            <Text style={styles.hudCardSub}>Not calculated</Text>
          </View>

          <View style={styles.hudCard}>
            <Text style={styles.hudCardLabel}>CONTACT TIME</Text>
            <Text style={styles.hudCardValue}>—</Text>
            <Text style={styles.hudCardSub}>Not calculated</Text>
          </View>

          <View style={styles.hudCard}>
            <Text style={styles.hudCardLabel}>SWAY COEFFICIENT</Text>
            <Text style={styles.hudCardValue}>—</Text>
            <Text style={styles.hudCardSub}>Not calculated</Text>
          </View>
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
  pauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F3FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtnActive: {
    backgroundColor: '#0058BD',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 14,
  },
  telemetryHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#181B23',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    ...SHADOWS.card,
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#53E16F',
  },
  hudStreamStatus: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#53E16F',
    letterSpacing: 0.5,
  },
  hudStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hudStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hudStat: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#C1C6D7',
    fontWeight: '600',
  },
  viewControlsWrapper: {
    alignItems: 'center',
  },
  viewPill: {
    flexDirection: 'row',
    backgroundColor: '#E6E8F3',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#D8D9E5',
  },
  viewTabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewTabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.soft,
  },
  viewTabBtnText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#414755',
  },
  viewTabBtnTextActive: {
    color: '#0058BD',
    fontWeight: '800',
  },
  heatmapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF9',
    ...SHADOWS.card,
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#181B23',
  },
  cardSubtitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#717786',
    marginTop: 2,
  },
  copBadge: {
    backgroundColor: '#D8E2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  copBadgeText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: '#0058BD',
  },
  feetCanvas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 270,
  },
  gaitPhaseContainer: {
    backgroundColor: '#F9F9FF',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ECEEF9',
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  phaseTitle: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: '#414755',
    textTransform: 'uppercase',
  },
  phaseValues: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#0058BD',
  },
  phaseTrack: {
    height: 14,
    borderRadius: 7,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  phaseBarStance: {
    backgroundColor: '#0058BD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseBarSwing: {
    backgroundColor: '#53E16F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseBarLabel: {
    fontFamily: 'Inter',
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  phaseStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  phaseStep: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#717786',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF9',
    ...SHADOWS.card,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F3FE',
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E0E2ED',
  },
  modeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: '#0058BD',
  },
  modeBtnText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    color: '#414755',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hudGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  hudCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF9',
    ...SHADOWS.soft,
  },
  hudCardLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: '#717786',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hudCardValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    fontWeight: '800',
    color: '#181B23',
  },
  hudCardUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: '#717786',
  },
  hudCardSub: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#717786',
    marginTop: 2,
  },
});
