import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GAIT_CLASSES, SHADOWS } from '../utils/constants';
import { formatTimestamp } from '../utils/formatters';

const CLINICAL_TIPS = {
  shuffle: 'Short step length and dragging detected. Cue patient to take deliberate high steps with rhythmic auditory pacing.',
  limp: 'Bilateral stance time asymmetry exceeds 25%. Inspect for joint discomfort or muscle fatigue.',
  unsteady: 'High lateral center-of-pressure sway. Recommend wider base of support and assistive support if ambulating outdoors.',
  toe_walk: 'Forefoot contact without heel-strike. Evaluate triceps surae tension and ankle dorsiflexion mobility.',
};

export const AlertCard = ({
  alert,
  onDismiss,
  onPress,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!alert) return null;

  const key = (alert.class || alert.title || 'normal').toLowerCase();
  const isDanger = alert.severity === 'danger' || key.includes('shuffle') || key.includes('limp') || key.includes('unsteady');
  const accentColor = isDanger ? '#BA1A1A' : '#FF9500';

  const tip = CLINICAL_TIPS[key] || alert.description;

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: `${accentColor}15` }]}>
            <MaterialCommunityIcons
              name={isDanger ? "alert-octagon" : "alert"}
              size={16}
              color={accentColor}
            />
          </View>
          <Text style={styles.timestamp}>
            {formatTimestamp(alert.ts).toUpperCase()}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => onDismiss && onDismiss(alert.id)}
        >
          <MaterialCommunityIcons name="close" size={16} color="#717786" />
        </TouchableOpacity>
      </View>

      {/* Title & Short Description */}
      <Text style={styles.title}>{alert.title}</Text>
      <Text style={styles.description} numberOfLines={expanded ? 6 : 2}>
        {alert.description}
      </Text>

      {/* Badges Row */}
      <View style={styles.badgesRow}>
        <View style={styles.badgePill}>
          <MaterialCommunityIcons name="shoe-print" size={12} color="#0058BD" />
          <Text style={styles.badgeText}>{alert.side || 'Bilateral'}</Text>
        </View>

        <View style={styles.badgePill}>
          <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={12} color="#0058BD" />
          <Text style={styles.badgeText}>
            {Math.round((alert.conf || 0.92) * 100)}% Confidence
          </Text>
        </View>

        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.expandBtnText}>
            {expanded ? 'Hide Advice' : 'Clinical Advice'}
          </Text>
          <MaterialCommunityIcons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color="#0058BD"
          />
        </TouchableOpacity>
      </View>

      {/* Expanded Clinical Intervention Tip */}
      {expanded && (
        <View style={styles.tipBox}>
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons name="medical-bag" size={14} color="#0058BD" />
            <Text style={styles.tipTitle}>Recommended Action</Text>
          </View>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#ECEEF9',
    gap: 8,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timestamp: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#717786',
    letterSpacing: 0.5,
  },
  dismissBtn: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#181B23',
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#414755',
    lineHeight: 18,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '600',
    color: '#181B23',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
    paddingVertical: 2,
  },
  expandBtnText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: '#0058BD',
  },
  tipBox: {
    backgroundColor: '#F8FAFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D8E2FF',
    marginTop: 4,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipTitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: '#0058BD',
  },
  tipText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
});

export default AlertCard;
