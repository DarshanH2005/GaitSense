import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import Svg, {
  Path,
  G,
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Line,
  Rect,
} from 'react-native-svg';
import { COLORS, SHADOWS } from '../utils/constants';

/**
 * Smooth RGB interpolation across 5 clinical force levels (0 - 4095 ADC)
 */
export function getSmoothPressureColor(value) {
  const v = Math.max(0, Math.min(4095, Number(value) || 0));

  const stops = [
    { pos: 0, r: 224, g: 231, b: 255 },     // Inactive Light Blue #E0E7FF
    { pos: 900, r: 100, g: 210, b: 255 },   // Cyan #64D2FF
    { pos: 1900, r: 83, g: 225, b: 111 },   // Healthy Green #53E16F
    { pos: 2900, r: 255, g: 184, b: 116 },  // Amber Caution #FFB874
    { pos: 4095, r: 255, g: 59, b: 48 },    // Peak Force Red #FF3B30
  ];

  let i = 0;
  while (i < stops.length - 1 && v > stops[i + 1].pos) {
    i++;
  }
  if (i >= stops.length - 1) {
    const last = stops[stops.length - 1];
    return `rgb(${last.r}, ${last.g}, ${last.b})`;
  }

  const s1 = stops[i];
  const s2 = stops[i + 1];
  const factor = (v - s1.pos) / (s2.pos - s1.pos);

  const r = Math.round(s1.r + (s2.r - s1.r) * factor);
  const g = Math.round(s1.g + (s2.g - s1.g) * factor);
  const b = Math.round(s1.b + (s2.b - s1.b) * factor);

  return `rgb(${r}, ${g}, ${b})`;
}

// 140 x 280 SVG coordinate space
const VB_WIDTH = 140;
const VB_HEIGHT = 280;

// Zone coordinates for LEFT foot
const ZONES_DEF = [
  { index: 0, key: 'heel', label: 'Heel', anatomical: 'Calcaneus', x: 70, y: 230, maxRadius: 32 },
  { index: 1, key: 'midfoot', label: 'Midfoot', anatomical: 'Lateral Arch', x: 44, y: 158, maxRadius: 26 },
  { index: 2, key: 'mth1', label: 'F-Medial', anatomical: '1st Metatarsal', x: 94, y: 88, maxRadius: 28 },
  { index: 3, key: 'mth4_5', label: 'F-Lateral', anatomical: '4-5th Metatarsal', x: 44, y: 98, maxRadius: 26 },
];

/**
 * Anatomical foot contour path (Left Foot)
 */
const LEFT_FOOT_PATH = `
  M 70 268
  C 48 268 34 254 34 226
  C 34 198 38 165 36 138
  C 34 112 26 90 26 68
  C 26 46 38 26 52 24
  C 60 22 66 30 72 34
  C 78 38 84 28 94 18
  C 106 6 116 10 118 24
  C 120 38 114 54 114 70
  C 114 88 104 110 102 135
  C 100 162 106 190 106 226
  C 106 254 92 268 70 268
  Z
`;

export const FootDiagram = React.memo(({
  side = 'L',
  fsrValues = [0, 0, 0, 0],
  size = 170,
  showLabels = true,
  isActive = true,
  showCOP = true,
  onZonePress,
}) => {
  const [selectedZone, setSelectedZone] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isRight = side === 'R';
  const aspectRatio = VB_HEIGHT / VB_WIDTH;
  const width = size;
  const height = size * aspectRatio;

  // Normalized values (0.0 to 1.0)
  const normalized = fsrValues.map((v) => Math.max(0, Math.min(1, (Number(v) || 0) / 4095)));

  // Peak loaded zone
  let peakIndex = 0;
  let maxVal = -1;
  fsrValues.forEach((val, idx) => {
    if (val > maxVal) {
      maxVal = val;
      peakIndex = idx;
    }
  });

  // Calculate Center of Pressure (COP)
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  ZONES_DEF.forEach((zone, idx) => {
    const w = Math.max(0.01, normalized[idx] || 0);
    totalWeight += w;
    weightedX += zone.x * w;
    weightedY += zone.y * w;
  });

  const copX = totalWeight > 0.05 ? weightedX / totalWeight : 70;
  const copY = totalWeight > 0.05 ? weightedY / totalWeight : 160;

  // Pulsing animation for peak zone
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: false,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  const handlePressZone = (zoneIndex) => {
    setSelectedZone(selectedZone === zoneIndex ? null : zoneIndex);
    if (onZonePress) onZonePress(zoneIndex, fsrValues[zoneIndex]);
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
        style={isRight ? styles.mirrorSvg : undefined}
      >
        <Defs>
          {/* Gradients for each zone */}
          {ZONES_DEF.map((zone, idx) => {
            const rawVal = fsrValues[idx] || 0;
            const centerColor = getSmoothPressureColor(rawVal);
            const intensity = Math.min(1, rawVal / 3200);

            return (
              <RadialGradient
                key={`grad-${zone.key}`}
                id={`grad-${side}-${zone.key}`}
                cx="50%"
                cy="50%"
                r="50%"
              >
                <Stop offset="0%" stopColor={centerColor} stopOpacity={0.95 * Math.max(0.4, intensity)} />
                <Stop offset="55%" stopColor={centerColor} stopOpacity={0.65 * intensity} />
                <Stop offset="85%" stopColor={centerColor} stopOpacity={0.25 * intensity} />
                <Stop offset="100%" stopColor={centerColor} stopOpacity="0" />
              </RadialGradient>
            );
          })}

          {/* Plantar Sole Background Depth Gradient */}
          <RadialGradient id="soleDepth" cx="50%" cy="40%" r="60%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="80%" stopColor="#F1F3FE" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#E0E2ED" stopOpacity="1" />
          </RadialGradient>
        </Defs>

        {/* Outer Shadow/Glow Silhouette */}
        <Path
          d={LEFT_FOOT_PATH}
          fill="none"
          stroke="#0058BD"
          strokeWidth="6"
          strokeOpacity="0.08"
        />

        {/* Anatomical Sole Silhouette */}
        <Path
          d={LEFT_FOOT_PATH}
          fill="url(#soleDepth)"
          stroke="#CBD5E1"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Anatomical Skeletal Grid Lines */}
        <G opacity="0.35">
          {/* Longitudinal Axis Line */}
          <Line x1="70" y1="230" x2="94" y2="88" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="3,3" />
          {/* Transverse Metatarsal Arch */}
          <Line x1="44" y1="98" x2="94" y2="88" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="3,3" />
          {/* Midfoot Stability Bridge */}
          <Line x1="70" y1="230" x2="44" y2="158" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2,2" />
        </G>

        {/* Dynamic Pressure Heat Spots */}
        {ZONES_DEF.map((zone, idx) => {
          const rawVal = fsrValues[idx] || 0;
          const radius = zone.maxRadius * (0.6 + 0.4 * normalized[idx]);
          const isPeak = idx === peakIndex && rawVal > 1200;

          return (
            <G key={`heat-${zone.key}`}>
              {/* Radial Heatmap Gradient Circle */}
              <Circle
                cx={zone.x}
                cy={zone.y}
                r={radius}
                fill={`url(#grad-${side}-${zone.key})`}
              />

              {/* Peak Force Pulsing Ring */}
              {isPeak && (
                <Circle
                  cx={zone.x}
                  cy={zone.y}
                  r={radius * 0.9}
                  fill="none"
                  stroke={getSmoothPressureColor(rawVal)}
                  strokeWidth="2"
                  strokeOpacity="0.7"
                />
              )}

              {/* Sensor Node Center Anchor */}
              <Circle
                cx={zone.x}
                cy={zone.y}
                r="4.5"
                fill={getSmoothPressureColor(rawVal)}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </G>
          );
        })}

        {/* Center of Pressure (COP) Marker & Butterfly Vector */}
        {showCOP && totalWeight > 0.1 && (
          <G>
            {/* COP Dynamic Vector from Heel to Current Target */}
            <Line
              x1="70"
              y1="230"
              x2={copX}
              y2={copY}
              stroke="#0058BD"
              strokeWidth="2"
              strokeDasharray="4,3"
              opacity="0.6"
            />
            {/* COP Outer Glowing Aura */}
            <Circle
              cx={copX}
              cy={copY}
              r="12"
              fill="#0058BD"
              fillOpacity="0.2"
            />
            {/* COP Crosshair Center */}
            <Circle
              cx={copX}
              cy={copY}
              r="6"
              fill="#0070EC"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <Circle
              cx={copX}
              cy={copY}
              r="2"
              fill="#FFFFFF"
            />
          </G>
        )}
      </Svg>

      {/* Floating Interactive Zone Inspector Overlay */}
      {ZONES_DEF.map((zone, idx) => {
        const rawVal = fsrValues[idx] || 0;
        const color = getSmoothPressureColor(rawVal);
        const posX = (isRight ? VB_WIDTH - zone.x : zone.x) * (width / VB_WIDTH) - 18;
        const posY = zone.y * (height / VB_HEIGHT) - 12;

        return (
          <TouchableOpacity
            key={`touch-${zone.key}`}
            style={[
              styles.touchTarget,
              {
                left: posX,
                top: posY,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => handlePressZone(idx)}
          >
            {showLabels && (
              <View style={[styles.zoneLabelPill, { borderColor: color }]}>
                <Text style={[styles.zoneLabelText, { color: rawVal > 2000 ? '#BA1A1A' : '#181B23' }]}>
                  {rawVal > 200 ? `${Math.round(rawVal / 40.95)}%` : zone.label}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Selected Zone Popover Tooltip */}
      {selectedZone !== null && (
        <View style={styles.tooltipCard}>
          <View style={styles.tooltipHeader}>
            <Text style={styles.tooltipTitle}>{ZONES_DEF[selectedZone].anatomical}</Text>
            <TouchableOpacity onPress={() => setSelectedZone(null)}>
              <Text style={styles.tooltipClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.tooltipValue}>
            Pressure: <Text style={{ fontWeight: '700', color: getSmoothPressureColor(fsrValues[selectedZone]) }}>
              {fsrValues[selectedZone]} ADC (~{(fsrValues[selectedZone] * 0.12).toFixed(1)} N)
            </Text>
          </Text>
        </View>
      )}

      {/* Bottom Side Tag */}
      <View style={styles.footBadgeContainer}>
        <View style={styles.footBadge}>
          <Text style={styles.footBadgeText}>
            {isRight ? 'RIGHT INSOLE' : 'LEFT INSOLE'}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mirrorSvg: {
    transform: [{ scaleX: -1 }],
  },
  touchTarget: {
    position: 'absolute',
    width: 36,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneLabelPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    ...SHADOWS.soft,
  },
  zoneLabelText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tooltipCard: {
    position: 'absolute',
    bottom: -35,
    backgroundColor: '#181B23',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 100,
    ...SHADOWS.card,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tooltipTitle: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: '#FEFCFF',
  },
  tooltipClose: {
    color: '#C1C6D7',
    fontSize: 10,
    fontWeight: '700',
  },
  tooltipValue: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#E0E2ED',
    marginTop: 2,
  },
  footBadgeContainer: {
    position: 'absolute',
    bottom: 2,
    alignItems: 'center',
  },
  footBadge: {
    backgroundColor: '#F1F3FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E2ED',
  },
  footBadgeText: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: '#414755',
    letterSpacing: 0.8,
  },
});

export default FootDiagram;
