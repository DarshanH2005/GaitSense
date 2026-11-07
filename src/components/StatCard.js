import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/constants';

export const StatCard = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  color = '#0058BD',
  trend,
  progress, // number 0.0 - 1.0
  accentTop = false,
  onPress,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  const isPositiveTrend = typeof trend === 'string' && trend.trim().startsWith('+');
  const isNegativeTrend = typeof trend === 'string' && trend.trim().startsWith('-');

  return (
    <Container
      style={[styles.card, accentTop && { borderTopWidth: 3, borderTopColor: color }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={styles.topRow}>
        {icon && (
          <View style={[styles.iconBox, { backgroundColor: `${color}14` }]}>
            <MaterialCommunityIcons name={icon} size={18} color={color} />
          </View>
        )}
        {trend && (
          <View
            style={[
              styles.trendBadge,
              isPositiveTrend
                ? styles.trendPos
                : isNegativeTrend
                ? styles.trendNeg
                : styles.trendNeu,
            ]}
          >
            <MaterialCommunityIcons
              name={isPositiveTrend ? "trending-up" : isNegativeTrend ? "trending-down" : "minus"}
              size={12}
              color={isPositiveTrend ? '#006E28' : isNegativeTrend ? '#BA1A1A' : '#717786'}
            />
            <Text
              style={[
                styles.trendText,
                { color: isPositiveTrend ? '#006E28' : isNegativeTrend ? '#BA1A1A' : '#717786' },
              ]}
            >
              {trend}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.valueRow}>
          <Text style={styles.valueText}>{value ?? '--'}</Text>
          {unit && <Text style={styles.unitText}>{unit}</Text>}
        </View>
        <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitleText} numberOfLines={1}>{subtitle}</Text>}

        {progress !== undefined && (
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: color },
              ]}
            />
          </View>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6E8F3',
    justifyContent: 'space-between',
    minHeight: 110,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  trendPos: {
    backgroundColor: '#ECFDF5',
  },
  trendNeg: {
    backgroundColor: '#FEF2F2',
  },
  trendNeu: {
    backgroundColor: '#F1F5F9',
  },
  trendText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    fontWeight: '700',
  },
  content: {
    gap: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  valueText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    fontWeight: '800',
    color: '#181B23',
    lineHeight: 22,
  },
  unitText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#717786',
  },
  titleText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: '#414755',
    marginTop: 2,
  },
  subtitleText: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#717786',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E0E2ED',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default StatCard;
