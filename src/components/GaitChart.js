import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Circle,
  Text as SvgText,
  Rect,
} from 'react-native-svg';
import { COLORS, SHADOWS } from '../utils/constants';

const PRESSURE_CHANNELS = [
  { key: 'heel', label: 'Heel', color: '#0070EC', index: 0 },
  { key: 'midfoot', label: 'Midfoot', color: '#53E16F', index: 1 },
  { key: 'forefootMedial', label: 'F-Medial', color: '#FFB874', index: 2 },
  { key: 'forefootLateral', label: 'F-Lateral', color: '#AF52DE', index: 3 },
];

const MOTION_CHANNELS = [
  { key: 'ax', label: 'Accel X', color: '#FF3B30', index: 0 },
  { key: 'ay', label: 'Accel Y', color: '#53E16F', index: 1 },
  { key: 'az', label: 'Accel Z', color: '#0070EC', index: 2 },
];

export const GaitChart = ({
  data = [],
  mode = 'pressure',
  side = 'both',
  height = 190,
}) => {
  const [containerWidth, setContainerWidth] = useState(340);
  const [activeChannels, setActiveChannels] = useState([0, 1, 2, 3]);

  const onLayout = (e) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && Math.abs(width - containerWidth) > 5) {
      setContainerWidth(width);
    }
  };

  const isPressure = mode === 'pressure';
  const channels = isPressure ? PRESSURE_CHANNELS : MOTION_CHANNELS;

  // Filter incoming stream packets
  const filteredData = (Array.isArray(data) ? data : []).filter((item) => {
    if (!item) return false;
    if (side === 'both' || !item.side) return true;
    return item.side === side;
  });

  const maxSamples = 24;
  const displayData = filteredData.slice(-maxSamples);
  const dataCount = displayData.length;

  const padTop = 14;
  const padBottom = 22;
  const padLeft = 32;
  const padRight = 14;

  const chartW = Math.max(100, containerWidth - padLeft - padRight);
  const chartH = Math.max(70, height - padTop - padBottom);

  const minY = isPressure ? 0 : -20;
  const maxY = isPressure ? 4095 : 20;

  const getYCoord = (val) => {
    const clamped = Math.max(minY, Math.min(maxY, Number(val) || 0));
    const normalized = (clamped - minY) / (maxY - minY);
    return padTop + (1 - normalized) * chartH;
  };

  const toggleChannel = (idx) => {
    if (activeChannels.includes(idx)) {
      if (activeChannels.length > 1) {
        setActiveChannels(activeChannels.filter((i) => i !== idx));
      }
    } else {
      setActiveChannels([...activeChannels, idx]);
    }
  };

  // Generate smooth SVG paths with area fill
  const generatePaths = (channel) => {
    if (dataCount < 2) return { linePath: '', areaPath: '', latestVal: 0 };

    const points = displayData.map((d, i) => {
      const sampleOffset = (maxSamples - dataCount) + i;
      const x = padLeft + (sampleOffset / (maxSamples - 1)) * chartW;

      let val = 0;
      if (isPressure) {
        if (Array.isArray(d.fsr)) {
          val = d.fsr[channel.index] || 0;
        } else if (d[channel.key] !== undefined) {
          val = d[channel.key];
        }
      } else {
        if (Array.isArray(d.accel)) {
          val = d.accel[channel.index] || 0;
        } else if (d[channel.key] !== undefined) {
          val = d[channel.key];
        }
      }
      return { x, y: getYCoord(val), val };
    });

    const latestVal = points[points.length - 1]?.val || 0;

    // Build smooth bezier path
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      linePath += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }

    const baselineY = getYCoord(minY);
    const lastPt = points[points.length - 1];
    const firstPt = points[0];
    const areaPath = `${linePath} L ${lastPt.x} ${baselineY} L ${firstPt.x} ${baselineY} Z`;

    return { linePath, areaPath, latestVal, lastX: lastPt.x, lastY: lastPt.y };
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Legend & Channel Filter Selector */}
      <View style={styles.legendRow}>
        {channels.map((ch) => {
          const isSelected = activeChannels.includes(ch.index);
          const { latestVal } = generatePaths(ch);

          return (
            <TouchableOpacity
              key={ch.key}
              style={[
                styles.legendChip,
                isSelected && { borderColor: ch.color, backgroundColor: `${ch.color}15` },
              ]}
              onPress={() => toggleChannel(ch.index)}
            >
              <View style={[styles.legendDot, { backgroundColor: ch.color }]} />
              <Text style={[styles.legendLabel, isSelected && { color: '#181B23', fontWeight: '700' }]}>
                {ch.label}
              </Text>
              <Text style={[styles.legendValue, { color: ch.color }]}>
                {isPressure ? Math.round(latestVal) : latestVal.toFixed(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main SVG Oscilloscope Canvas */}
      <View style={styles.chartCanvas}>
        <Svg width={containerWidth} height={height}>
          <Defs>
            {channels.map((ch) => (
              <LinearGradient key={`fill-${ch.key}`} id={`grad-${ch.key}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={ch.color} stopOpacity="0.35" />
                <Stop offset="80%" stopColor={ch.color} stopOpacity="0.05" />
                <Stop offset="100%" stopColor={ch.color} stopOpacity="0.0" />
              </LinearGradient>
            ))}
          </Defs>

          {/* Background Grid Lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = padTop + ratio * chartH;
            const gridVal = isPressure
              ? Math.round(maxY - ratio * (maxY - minY))
              : (maxY - ratio * (maxY - minY)).toFixed(0);

            return (
              <React.Fragment key={`grid-${idx}`}>
                <Line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + chartW}
                  y2={y}
                  stroke="#E0E2ED"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <SvgText
                  x={padLeft - 6}
                  y={y + 3}
                  fontSize="9"
                  fontFamily={Platform.OS === 'ios' ? 'Courier' : 'monospace'}
                  fill="#717786"
                  textAnchor="end"
                >
                  {gridVal}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Time scale markings */}
          <SvgText x={padLeft} y={height - 6} fontSize="9" fill="#717786" textAnchor="start">
            -12s
          </SvgText>
          <SvgText x={padLeft + chartW / 2} y={height - 6} fontSize="9" fill="#717786" textAnchor="middle">
            -6s
          </SvgText>
          <SvgText x={padLeft + chartW} y={height - 6} fontSize="9" fill="#0058BD" fontWeight="700" textAnchor="end">
            LIVE
          </SvgText>

          {/* Waveform Curves and Glow Areas */}
          {channels.map((ch) => {
            if (!activeChannels.includes(ch.index)) return null;
            const { linePath, areaPath, lastX, lastY } = generatePaths(ch);
            if (!linePath) return null;

            return (
              <React.Fragment key={`wave-${ch.key}`}>
                {/* Area Gradient Fill */}
                <Path d={areaPath} fill={`url(#grad-${ch.key})`} />

                {/* Main Glowing Polyline */}
                <Path
                  d={linePath}
                  fill="none"
                  stroke={ch.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Leading Edge Target Point */}
                {lastX !== undefined && (
                  <Circle
                    cx={lastX}
                    cy={lastY}
                    r="4"
                    fill={ch.color}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E2ED',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#717786',
  },
  legendValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  chartCanvas: {
    backgroundColor: '#FBFBFE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEEF9',
    overflow: 'hidden',
  },
});

export default GaitChart;
