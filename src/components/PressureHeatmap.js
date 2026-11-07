import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FootDiagram } from './FootDiagram';
import { COLORS, SHADOWS } from '../utils/constants';

export const PressureHeatmap = ({
  latestLeft,
  latestRight,
  leftStatus = 'connected',
  rightStatus = 'connected',
  onFootPress,
}) => {
  const [activeTab, setActiveTab] = useState('both'); // 'left' | 'both' | 'right'

  const leftFsr = latestLeft?.fsr || [1850, 1120, 2450, 2180];
  const rightFsr = latestRight?.fsr || [1780, 1080, 2390, 2100];

  // Calculate bilateral load balance
  const sumL = leftFsr.reduce((a, b) => a + b, 0) || 1;
  const sumR = rightFsr.reduce((a, b) => a + b, 0) || 1;
  const total = sumL + sumR;
  const pctL = Math.round((sumL / total) * 100);
  const pctR = 100 - pctL;

  return (
    <View style={styles.card}>
      {/* Header with Title & Foot Selector */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Plantar Pressure Matrix</Text>
          <Text style={styles.subtitle}>4-Zone High-Res Dynamic Force Array</Text>
        </View>

        {/* View Switcher Pill */}
        <View style={styles.pillContainer}>
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'left' && styles.pillBtnActive]}
            onPress={() => setActiveTab('left')}
          >
            <Text style={[styles.pillBtnText, activeTab === 'left' && styles.pillBtnTextActive]}>L</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'both' && styles.pillBtnActive]}
            onPress={() => setActiveTab('both')}
          >
            <Text style={[styles.pillBtnText, activeTab === 'both' && styles.pillBtnTextActive]}>Both</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'right' && styles.pillBtnActive]}
            onPress={() => setActiveTab('right')}
          >
            <Text style={[styles.pillBtnText, activeTab === 'right' && styles.pillBtnTextActive]}>R</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bilateral Load Balance Bar */}
      <View style={styles.balanceContainer}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceSideText}>Left {pctL}%</Text>
          <Text style={styles.balanceTitle}>Bilateral Load Distribution</Text>
          <Text style={styles.balanceSideText}>{pctR}% Right</Text>
        </View>
        <View style={styles.balanceTrack}>
          <View style={[styles.balanceFillLeft, { width: `${pctL}%` }]} />
          <View style={styles.balanceCenterMarker} />
          <View style={[styles.balanceFillRight, { width: `${pctR}%` }]} />
        </View>
      </View>

      {/* Feet Render Canvas */}
      <View style={styles.feetCanvas}>
        {(activeTab === 'left' || activeTab === 'both') && (
          <TouchableOpacity
            style={styles.footWrapper}
            activeOpacity={0.9}
            onPress={() => onFootPress && onFootPress('L')}
          >
            <FootDiagram
              side="L"
              fsrValues={leftFsr}
              size={155}
              showLabels={true}
              showCOP={true}
            />
          </TouchableOpacity>
        )}

        {(activeTab === 'right' || activeTab === 'both') && (
          <TouchableOpacity
            style={styles.footWrapper}
            activeOpacity={0.9}
            onPress={() => onFootPress && onFootPress('R')}
          >
            <FootDiagram
              side="R"
              fsrValues={rightFsr}
              size={155}
              showLabels={true}
              showCOP={true}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Color Scale Gradient Legend Bar */}
      <View style={styles.legendWrapper}>
        <View style={styles.legendGradientBar}>
          <View style={[styles.gradStep, { backgroundColor: '#64D2FF' }]} />
          <View style={[styles.gradStep, { backgroundColor: '#53E16F' }]} />
          <View style={[styles.gradStep, { backgroundColor: '#FFB874' }]} />
          <View style={[styles.gradStep, { backgroundColor: '#FF3B30' }]} />
        </View>
        <View style={styles.legendLabels}>
          <Text style={styles.legendText}>0 N (Light)</Text>
          <Text style={styles.legendText}>150 N (Optimal)</Text>
          <Text style={styles.legendText}>300 N (Peak)</Text>
          <Text style={styles.legendText}>500 N+ (Max)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E8F3',
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#181B23',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#717786',
    marginTop: 2,
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F3FE',
    borderRadius: 14,
    padding: 2.5,
    borderWidth: 1,
    borderColor: '#E0E2ED',
  },
  pillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBtnActive: {
    backgroundColor: '#0058BD',
  },
  pillBtnText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: '#414755',
  },
  pillBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  balanceContainer: {
    backgroundColor: '#F9F9FF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECEEF9',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  balanceSideText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#0058BD',
  },
  balanceTitle: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    color: '#717786',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceTrack: {
    height: 8,
    backgroundColor: '#E0E2ED',
    borderRadius: 4,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  balanceFillLeft: {
    backgroundColor: '#0058BD',
    height: '100%',
  },
  balanceFillRight: {
    backgroundColor: '#0070EC',
    height: '100%',
  },
  balanceCenterMarker: {
    width: 2,
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  feetCanvas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 280,
  },
  footWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendWrapper: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ECEEF9',
  },
  legendGradientBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 4,
  },
  gradStep: {
    flex: 1,
  },
  legendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    color: '#717786',
  },
});

export default PressureHeatmap;
