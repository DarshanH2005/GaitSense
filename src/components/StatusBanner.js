import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GAIT_CLASSES, SHADOWS } from '../utils/constants';
import { formatConfidence } from '../utils/formatters';

export const StatusBanner = ({
  gaitClass = 'unknown',
  confidence = 0,
  cadence = null,
  symmetry = null,
  side = 'Bilateral',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const key = (gaitClass || 'unknown').toLowerCase().trim();
  const classInfo = GAIT_CLASSES[key] || GAIT_CLASSES.unknown;

  const isAnomaly = !['normal', 'standing', 'unknown'].includes(key);
  const statusColor = key === 'unknown' ? '#717786' : (isAnomaly ? (key === 'unsteady' ? '#FF9500' : '#BA1A1A') : '#006E28');
  const strokeDash = `${Math.round(confidence * 92)}, 100`;

  useEffect(() => {
    const isWeb = Platform.OS === 'web';
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: isAnomaly ? 800 : 1600,
          useNativeDriver: !isWeb,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: isAnomaly ? 800 : 1600,
          useNativeDriver: !isWeb,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isAnomaly, pulseAnim]);

  return (
    <View style={styles.card}>
      {/* Top Banner Ticker */}
      <View style={styles.topRow}>
        <View style={styles.liveStreamBadge}>
          <View style={[styles.liveDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.liveText, { color: statusColor }]}>
            {key === 'unknown' ? 'CLASSIFICATION UNAVAILABLE' : (isAnomaly ? 'RESEARCH PATTERN FLAG' : 'MODEL ACTIVITY CLASS')}
          </Text>
        </View>
        <Text style={styles.sideText}>{side}</Text>
      </View>

      {/* Center Circular Master Gauge */}
      <View style={styles.gaugeContainer}>
        {/* Animated Background Pulse Aura */}
        <Animated.View
          style={[
            styles.pulseAura,
            {
              backgroundColor: `${statusColor}14`,
              borderColor: `${statusColor}33`,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        <View style={styles.gaugeWrapper}>
          <Svg width={210} height={210} viewBox="0 0 36 36" style={styles.svgRotate}>
            <Defs>
              <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={statusColor} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={statusColor} stopOpacity="1" />
              </LinearGradient>
            </Defs>

            {/* Inactive Track */}
            <Path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#E0E2ED"
              strokeWidth="2.8"
            />

            {/* Active Progress Arc */}
            <Path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="3.2"
              strokeDasharray={strokeDash}
              strokeLinecap="round"
            />
          </Svg>

          {/* Center Hub Metrics */}
          <View style={styles.centerHub}>
            <MaterialCommunityIcons
              name={isAnomaly ? "alert-circle" : (key === 'unknown' ? 'help-circle-outline' : 'walk')}
              size={36}
              color={statusColor}
              style={styles.iconCenter}
            />
            <Text style={styles.classificationTitle}>
              {classInfo.label.replace(' Gait', '')}
            </Text>
            <View style={[styles.confidencePill, { backgroundColor: isAnomaly ? '#FFDAD6' : '#6FFB8533' }]}>
              <Text style={[styles.confidencePillText, { color: statusColor }]}>
                {key === 'unknown' ? 'No trained result' : `${formatConfidence(confidence)} Confidence`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Clinical Biomarker Summary Row */}
      <View style={styles.biomarkersRow}>
        <View style={styles.bioItem}>
          <Text style={styles.bioLabel}>CADENCE</Text>
          <Text style={styles.bioValue}>{cadence == null ? '—' : cadence} {cadence == null ? null : <Text style={styles.bioUnit}>spm</Text>}</Text>
        </View>
        <View style={styles.bioDivider} />
        <View style={styles.bioItem}>
          <Text style={styles.bioLabel}>SYMMETRY</Text>
          <Text style={[styles.bioValue, { color: '#006E28' }]}>{symmetry == null ? '—' : `${Math.round(symmetry)}%`}</Text>
        </View>
        <View style={styles.bioDivider} />
        <View style={styles.bioItem}>
          <Text style={styles.bioLabel}>RISK INDEX</Text>
          <Text style={[styles.bioValue, { color: '#717786' }]}>Not available</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E8F3',
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveStreamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F3FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  liveText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sideText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: '#717786',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  pulseAura: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
  },
  gaugeWrapper: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgRotate: {
    transform: [{ rotate: '-90deg' }],
  },
  centerHub: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCenter: {
    marginBottom: 2,
  },
  classificationTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '800',
    color: '#181B23',
    marginBottom: 4,
  },
  confidencePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  confidencePillText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
  },
  biomarkersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F9F9FF',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ECEEF9',
  },
  bioItem: {
    alignItems: 'center',
    flex: 1,
  },
  bioLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: '#717786',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bioValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: '700',
    color: '#181B23',
  },
  bioUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: '#717786',
  },
  bioDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E0E2ED',
  },
});

export default StatusBanner;
