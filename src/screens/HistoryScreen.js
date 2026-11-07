import React, { useState } from 'react';
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
import { useGait } from '../context/GaitContext';
import { formatNumber } from '../utils/formatters';
import { COLORS, SHADOWS } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DATES = [
  { id: '0', label: 'Today', sub: 'Aug 25', status: 'normal' },
  { id: '1', label: 'Mon', sub: 'Aug 24', status: 'normal' },
  { id: '2', label: 'Sun', sub: 'Aug 23', status: 'warning' },
  { id: '3', label: 'Sat', sub: 'Aug 22', status: 'normal' },
  { id: '4', label: 'Fri', sub: 'Aug 21', status: 'danger' },
  { id: '5', label: 'Thu', sub: 'Aug 20', status: 'normal' },
  { id: '6', label: 'Wed', sub: 'Aug 19', status: 'normal' },
];

const MOCK_DAYS = [
  { day: 'Wed', steps: 3400, symmetry: 94, normal: 92, shuffle: 5, unsteady: 3 },
  { day: 'Thu', steps: 4200, symmetry: 91, normal: 89, shuffle: 7, unsteady: 4 },
  { day: 'Fri', steps: 2950, symmetry: 84, normal: 78, shuffle: 14, unsteady: 8 },
  { day: 'Sat', steps: 5100, symmetry: 95, normal: 94, shuffle: 4, unsteady: 2 },
  { day: 'Sun', steps: 3800, symmetry: 88, normal: 86, shuffle: 9, unsteady: 5 },
  { day: 'Mon', steps: 4600, symmetry: 93, normal: 91, shuffle: 6, unsteady: 3 },
  { day: 'Today', steps: 2847, symmetry: 94, normal: 92, shuffle: 5, unsteady: 3 },
];

export default function HistoryScreen({ navigation }) {
  const { todayStats } = useGait ? useGait() : {};
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);

  const currentDay = MOCK_DAYS[6 - selectedDateIdx] || MOCK_DAYS[6];
  const steps = selectedDateIdx === 0 ? (todayStats?.totalSteps || 2847) : currentDay.steps;
  const symmetry = selectedDateIdx === 0 ? (todayStats?.symmetryScore || 94) : currentDay.symmetry;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FF" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.navigate('BLEScan')}>
          <MaterialCommunityIcons name="bluetooth-settings" size={24} color="#0058BD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gait Analytics & Trends</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.navigate('Profile')}>
          <MaterialCommunityIcons name="file-document-outline" size={22} color="#0058BD" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Calendar Timeline */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datePillsRow}
        >
          {DATES.map((item, idx) => {
            const isSelected = selectedDateIdx === idx;
            const dotColor = item.status === 'normal' ? '#006E28' : item.status === 'warning' ? '#FF9500' : '#BA1A1A';

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.datePill, isSelected && styles.datePillActive]}
                onPress={() => setSelectedDateIdx(idx)}
              >
                <View style={styles.datePillTop}>
                  <Text style={[styles.datePillLabel, isSelected && styles.datePillLabelActive]}>
                    {item.label}
                  </Text>
                  <View style={[styles.statusDot, { backgroundColor: isSelected ? '#FFFFFF' : dotColor }]} />
                </View>
                <Text style={[styles.datePillSub, isSelected && styles.datePillSubActive]}>
                  {item.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bento Grid Daily Summary */}
        <View style={styles.bentoCard}>
          <View style={styles.bentoHeader}>
            <Text style={styles.bentoTitle}>Daily Summary ({DATES[selectedDateIdx].label})</Text>
            <View style={styles.baselineBadge}>
              <Text style={styles.baselineText}>+4.2% vs 30d Baseline</Text>
            </View>
          </View>

          <View style={styles.bentoGrid}>
            {/* Steps Box */}
            <View style={styles.bentoItem}>
              <View style={styles.bentoItemTop}>
                <MaterialCommunityIcons name="shoe-print" size={20} color="#0058BD" />
                <Text style={styles.bentoPillTag}>Target 6k</Text>
              </View>
              <View>
                <Text style={styles.bentoValue}>{formatNumber(steps)}</Text>
                <Text style={styles.bentoLabel}>TOTAL STEPS</Text>
              </View>
            </View>

            {/* Symmetry Box */}
            <View style={styles.bentoItem}>
              <View style={styles.bentoItemTop}>
                <MaterialCommunityIcons name="scale-balance" size={20} color="#006E28" />
                <Text style={[styles.bentoPillTag, { backgroundColor: '#ECFDF5', color: '#006E28' }]}>Optimal</Text>
              </View>
              <View>
                <Text style={[styles.bentoValue, { color: '#006E28' }]}>{symmetry}%</Text>
                <Text style={styles.bentoLabel}>BILATERAL SYMMETRY</Text>
              </View>
            </View>

            {/* Dominant Pattern Box */}
            <View style={[styles.bentoItem, styles.bentoItemFull]}>
              <View style={styles.patternRow}>
                <View>
                  <Text style={styles.patternTitle}>Normal Gait Pattern</Text>
                  <Text style={styles.patternSub}>92% of today's walking bouts classified as stable</Text>
                </View>
                <View style={styles.dominantPill}>
                  <Text style={styles.dominantPillText}>STABLE</Text>
                </View>
              </View>

              {/* Classification Distribution Stacked Bar */}
              <View style={styles.distributionBar}>
                <View style={[styles.distSegment, { flex: currentDay.normal, backgroundColor: '#006E28' }]} />
                <View style={[styles.distSegment, { flex: currentDay.shuffle, backgroundColor: '#FF9500' }]} />
                <View style={[styles.distSegment, { flex: currentDay.unsteady, backgroundColor: '#BA1A1A' }]} />
              </View>

              <View style={styles.distLegendRow}>
                <View style={styles.distLegendItem}>
                  <View style={[styles.distDot, { backgroundColor: '#006E28' }]} />
                  <Text style={styles.distLegendText}>Normal {currentDay.normal}%</Text>
                </View>
                <View style={styles.distLegendItem}>
                  <View style={[styles.distDot, { backgroundColor: '#FF9500' }]} />
                  <Text style={styles.distLegendText}>Shuffle {currentDay.shuffle}%</Text>
                </View>
                <View style={styles.distLegendItem}>
                  <View style={[styles.distDot, { backgroundColor: '#BA1A1A' }]} />
                  <Text style={styles.distLegendText}>Unsteady {currentDay.unsteady}%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 7-Day Steps Volume Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartTitleRow}>
            <View>
              <Text style={styles.chartTitle}>7-Day Step Volume</Text>
              <Text style={styles.chartSubtitle}>Daily average: 3,842 steps</Text>
            </View>
            <View style={styles.goalLineBadge}>
              <View style={styles.goalDashedLine} />
              <Text style={styles.goalLineText}>6k Target</Text>
            </View>
          </View>

          <View style={styles.barChartContainer}>
            {MOCK_DAYS.map((d, i) => {
              const heightPct = Math.min(100, Math.max(15, (d.steps / 6000) * 100));
              const isToday = i === 6;

              return (
                <View key={i} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPct}%`,
                          backgroundColor: isToday ? '#0070EC' : '#D8E2FF',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDayText, isToday && styles.barDayTextActive]}>
                    {d.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 7-Day Symmetry Score Trend */}
        <View style={styles.chartCard}>
          <View style={styles.chartTitleRow}>
            <View>
              <Text style={styles.chartTitle}>Symmetry Trend (%)</Text>
              <Text style={[styles.chartSubtitle, { color: '#006E28' }]}>Therapeutic Zone: ≥85%</Text>
            </View>
            <View style={styles.optimalBandBadge}>
              <Text style={styles.optimalBandText}>Target Band</Text>
            </View>
          </View>

          <View style={styles.symmetryTrackContainer}>
            {MOCK_DAYS.map((d, i) => {
              const isOptimal = d.symmetry >= 90;
              return (
                <View key={i} style={styles.symCol}>
                  <Text style={styles.symValText}>{d.symmetry}%</Text>
                  <View style={styles.symPinBox}>
                    <View style={[styles.symPinDot, { backgroundColor: isOptimal ? '#006E28' : '#FF9500' }]} />
                  </View>
                  <Text style={styles.symDayText}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* AI Clinical Insight Card */}
        <View style={styles.aiInsightCard}>
          <View style={styles.aiHeader}>
            <MaterialCommunityIcons name="brain" size={20} color="#0058BD" />
            <Text style={styles.aiTitle}>Clinical Biomarker Summary</Text>
          </View>
          <Text style={styles.aiDescription}>
            Bilateral symmetry showed a +3.8% improvement over the past 72 hours. Stance phase duration on the left insole stabilized to 62%, indicating balanced loading during outdoor ambulation.
          </Text>
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
  datePillsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E2ED',
    minWidth: 70,
    ...SHADOWS.soft,
  },
  datePillActive: {
    backgroundColor: '#0058BD',
    borderColor: '#0058BD',
  },
  datePillTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  datePillLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#181B23',
  },
  datePillLabelActive: {
    color: '#FFFFFF',
  },
  datePillSub: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#717786',
  },
  datePillSubActive: {
    color: '#D8E2FF',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF9',
    ...SHADOWS.card,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bentoTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#181B23',
  },
  baselineBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  baselineText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: '#006E28',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bentoItem: {
    width: (SCREEN_WIDTH - 74) / 2,
    backgroundColor: '#F1F3FE',
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  bentoItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoPillTag: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: '#0058BD',
    backgroundColor: '#D8E2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bentoItemFull: {
    width: '100%',
    paddingVertical: 14,
    gap: 10,
  },
  bentoValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
    fontWeight: '800',
    color: '#181B23',
  },
  bentoLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: '#717786',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patternTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#181B23',
  },
  patternSub: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#717786',
    marginTop: 2,
  },
  dominantPill: {
    backgroundColor: '#6FFB85',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dominantPillText: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '800',
    color: '#00732A',
  },
  distributionBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  distSegment: {
    height: '100%',
  },
  distLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  distLegendText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#414755',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF9',
    ...SHADOWS.card,
  },
  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  chartTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#181B23',
  },
  chartSubtitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#717786',
    marginTop: 2,
  },
  goalLineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalDashedLine: {
    width: 12,
    height: 2,
    backgroundColor: '#0058BD',
  },
  goalLineText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    color: '#0058BD',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 24,
    height: 90,
    backgroundColor: '#F1F3FE',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barDayText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#717786',
    marginTop: 6,
  },
  barDayTextActive: {
    fontWeight: '800',
    color: '#0058BD',
  },
  optimalBandBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optimalBandText: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: '#006E28',
  },
  symmetryTrackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
    paddingHorizontal: 6,
  },
  symCol: {
    alignItems: 'center',
    gap: 4,
  },
  symValText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#181B23',
  },
  symPinBox: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F1F3FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symPinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  symDayText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#717786',
  },
  aiInsightCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#0058BD',
  },
  aiDescription: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
  },
});
