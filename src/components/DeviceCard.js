import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

/**
 * Helper to compute number of signal bars from RSSI value (e.g. -45 dBm to -95 dBm)
 */
function getSignalBars(rssi) {
  if (rssi === undefined || rssi === null) return 2;
  const num = Number(rssi);
  if (num >= -60) return 4;
  if (num >= -72) return 3;
  if (num >= -84) return 2;
  return 1;
}

export const DeviceCard = ({
  device = {},
  status = 'disconnected',
  onConnect,
  onDisconnect,
}) => {
  const {
    id,
    name = 'GaitSense Insole',
    rssi,
    side = 'L',
    battery = 85,
  } = device;

  const isConnected = status === 'connected' || device.connected === true;
  const isConnecting = status === 'connecting';
  const signalBars = getSignalBars(rssi);
  const isLeft = side === 'L';

  const handleAction = () => {
    if (isConnected) {
      onDisconnect && onDisconnect(device);
    } else if (!isConnecting) {
      onConnect && onConnect(device);
    }
  };

  return (
    <View style={[styles.card, isConnected && styles.cardConnected]}>
      <View style={styles.mainRow}>
        {/* Foot Side Insole Icon */}
        <View
          style={[
            styles.sideIconContainer,
            { backgroundColor: isLeft ? '#EBF5FF' : '#F5F3FF' },
          ]}
        >
          <MaterialCommunityIcons
            name={isLeft ? 'shoe-sneaker' : 'shoe-sneaker'}
            size={24}
            color={isLeft ? COLORS.Primary : COLORS.Accent}
            style={!isLeft ? { transform: [{ scaleX: -1 }] } : undefined}
          />
          <View
            style={[
              styles.sideBadge,
              { backgroundColor: isLeft ? COLORS.Primary : COLORS.Accent },
            ]}
          >
            <Text style={styles.sideBadgeText}>{isLeft ? 'L' : 'R'}</Text>
          </View>
        </View>

        {/* Device Information */}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.deviceName} numberOfLines={1}>
              {name}
            </Text>
            {isConnected && (
              <View style={styles.liveStatusDot}>
                <View style={styles.greenPulse} />
              </View>
            )}
          </View>
          <Text style={styles.deviceId} numberOfLines={1}>
            {id || 'BLE Device'}
          </Text>

          {/* Telemetry Row: Signal & Battery */}
          <View style={styles.telemetryRow}>
            {/* RSSI Signal Strength Bars */}
            <View style={styles.signalGroup}>
              <View style={styles.barsWrapper}>
                {[1, 2, 3, 4].map((bar) => {
                  const active = bar <= signalBars;
                  return (
                    <View
                      key={`bar-${bar}`}
                      style={[
                        styles.signalBar,
                        { height: 4 + bar * 2.5 },
                        active ? styles.signalBarActive : styles.signalBarInactive,
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={styles.telemetryText}>
                {rssi ? `${rssi} dBm` : 'Good'}
              </Text>
            </View>

            {/* Battery Indicator */}
            {isConnected && battery !== undefined && (
              <View style={styles.batteryGroup}>
                <MaterialCommunityIcons
                  name={
                    battery > 75
                      ? 'battery'
                      : battery > 50
                      ? 'battery-70'
                      : battery > 20
                      ? 'battery-30'
                      : 'battery-alert'
                  }
                  size={16}
                  color={battery <= 20 ? COLORS.Danger : COLORS.Success}
                />
                <Text style={styles.telemetryText}>{battery}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* Connection Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isConnected
              ? styles.disconnectButton
              : isConnecting
              ? styles.connectingButton
              : styles.connectButton,
          ]}
          onPress={handleAction}
          disabled={isConnecting}
          activeOpacity={0.8}
        >
          {isConnecting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.actionButtonText,
                isConnected ? styles.disconnectButtonText : styles.connectButtonText,
              ]}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.Surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.CardBorder,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardConnected: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 12,
  },
  sideBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TextPrimary,
    marginRight: 6,
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.Success,
  },
  greenPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.Success,
  },
  deviceId: {
    fontSize: 11,
    color: COLORS.TextTertiary,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  signalGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 14,
    marginRight: 4,
    gap: 2,
  },
  signalBar: {
    width: 3,
    borderRadius: 1,
  },
  signalBarActive: {
    backgroundColor: COLORS.Primary,
  },
  signalBarInactive: {
    backgroundColor: '#CBD5E1',
  },
  batteryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  telemetryText: {
    fontSize: 11,
    color: COLORS.TextSecondary,
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButton: {
    backgroundColor: COLORS.Primary,
  },
  disconnectButton: {
    backgroundColor: '#FEE2E2',
  },
  connectingButton: {
    backgroundColor: COLORS.PrimaryDark,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  connectButtonText: {
    color: '#FFFFFF',
  },
  disconnectButtonText: {
    color: COLORS.Danger,
  },
});

export default DeviceCard;
