import { Platform } from 'react-native';

export const BLE_CONFIG = {
  SERVICE_UUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  GAIT_DATA_CHAR_UUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  COMMAND_CHAR_UUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a9',
  DEVICE_PREFIXES: {
    LEFT: 'GaitInsole-L',
    RIGHT: 'GaitInsole-R',
  },
  SCAN_TIMEOUT_MS: 10000,
  RECONNECT_INTERVAL_MS: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
};

export const COLORS = {
  Primary: '#0058BD', // Stitch Primary Blue
  PrimaryContainer: '#0070EC',
  OnPrimary: '#FFFFFF',
  OnPrimaryContainer: '#FEFCFF',
  PrimaryLight: '#D8E2FF',
  PrimaryFixedDim: '#ADC6FF',

  Secondary: '#006E28', // Stitch Healthy Green
  SecondaryContainer: '#6FFB85',
  OnSecondaryContainer: '#00732A',
  SecondaryFixedDim: '#53E16F',
  Success: '#006E28',

  Tertiary: '#894D00', // Stitch Caution Amber
  TertiaryContainer: '#AC6300',
  TertiaryFixedDim: '#FFB874',
  Warning: '#FF9500',

  Error: '#BA1A1A', // Stitch Anomaly Red
  ErrorContainer: '#FFDAD6',
  OnError: '#FFFFFF',
  Danger: '#FF3B30',

  Background: '#F9F9FF', // Stitch Clean Medical Canvas
  Surface: '#F9F9FF',
  SurfaceContainerLowest: '#FFFFFF', // White Card Base
  SurfaceContainerLow: '#F1F3FE',
  SurfaceContainer: '#ECEDF9',
  SurfaceContainerHigh: '#E6E8F3',
  SurfaceContainerHighest: '#E0E2ED',

  TextPrimary: '#181B23', // Stitch on-surface
  TextSecondary: '#414755', // Stitch on-surface-variant
  TextTertiary: '#717786', // Stitch outline
  Outline: '#717786',
  OutlineVariant: '#C1C6D7',

  CardBorder: '#E0E2ED',
  Accent: '#5856D6',
  ToeWalkAccent: '#AF52DE',
  Overlay: 'rgba(24, 27, 35, 0.4)',

  PressureLow: '#64D2FF',
  PressureMedium: '#53E16F',
  PressureHigh: '#FFB874',
  PressureMax: '#FF3B30',
};

export const FONTS = {
  body: Platform.select({
    web: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  mono: Platform.select({
    web: '"JetBrains Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    ios: 'Courier',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const GAIT_CLASSES = {
  unknown: {
    key: 'unknown', label: 'Unclassified', color: '#717786', badgeColor: 'rgba(113, 119, 134, 0.15)',
    description: 'A trained model and a valid calibrated window are required.', severity: 'none', icon: 'help-circle-outline',
  },
  standing: {
    key: 'standing', label: 'Standing', color: '#0058BD', badgeColor: 'rgba(0, 88, 189, 0.12)',
    description: 'Research model activity class.', severity: 'none', icon: 'human-standing',
  },
  normal: {
    key: 'normal',
    label: 'Normal Gait',
    color: '#34C759',
    badgeColor: 'rgba(52, 199, 89, 0.15)',
    description: 'Stable and balanced gait pattern',
    severity: 'none',
    icon: 'checkmark-circle-outline',
  },
  shuffle: {
    key: 'shuffle',
    label: 'Shuffling Gait',
    color: '#FF9500',
    badgeColor: 'rgba(255, 149, 0, 0.15)',
    description: "Short, dragging steps detected — may indicate early Parkinson's symptoms",
    severity: 'warning',
    icon: 'footsteps-outline',
  },
  limp: {
    key: 'limp',
    label: 'Limping Gait',
    color: '#FF3B30',
    badgeColor: 'rgba(255, 59, 48, 0.15)',
    description: 'Asymmetric stride pattern — possible injury or joint issue',
    severity: 'danger',
    icon: 'alert-circle-outline',
  },
  unsteady: {
    key: 'unsteady',
    label: 'Unsteady Balance',
    color: '#FF3B30',
    badgeColor: 'rgba(255, 59, 48, 0.15)',
    description: 'Balance instability detected — fall risk elevated',
    severity: 'danger',
    icon: 'warning-outline',
  },
  toe_walk: {
    key: 'toe_walk',
    label: 'Toe Walking',
    color: '#AF52DE',
    badgeColor: 'rgba(175, 82, 222, 0.15)',
    description: 'Forefoot-dominant walking — may indicate neurological condition',
    severity: 'warning',
    icon: 'walk-outline',
  },
};

export const FSR_ZONES = [
  { index: 0, key: 'heel', label: 'Heel', anatomical: 'Calcaneus' },
  { index: 1, key: 'midfoot', label: 'Midfoot', anatomical: 'Lateral Arch / Cuboid' },
  { index: 2, key: 'mth1', label: 'Forefoot Medial', anatomical: '1st Metatarsal Head (Inner)' },
  { index: 3, key: 'mth4_5', label: 'Forefoot Lateral', anatomical: '4th & 5th Metatarsal Heads (Outer)' },
];

export const FSR_PRESSURE_RANGES = [
  { min: 0, max: 1000, label: 'Low', color: '#64D2FF', description: 'Light contact / Swing phase' },
  { min: 1000, max: 2000, label: 'Medium', color: '#53E16F', description: 'Normal weight bearing' },
  { min: 2000, max: 3000, label: 'High', color: '#FFB874', description: 'Peak push-off force' },
  { min: 3000, max: 4095, label: 'Max', color: '#FF3B30', description: 'High impact / Stress zone' },
];

export const SHADOWS = {
  soft: Platform.select({
    web: { boxShadow: '0px 2px 6px rgba(24, 27, 35, 0.04)' },
    default: {
      shadowColor: '#181B23',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
  }),
  card: Platform.select({
    web: { boxShadow: '0px 4px 12px rgba(0, 43, 102, 0.06)' },
    default: {
      shadowColor: '#002B66',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
  }),
  floating: Platform.select({
    web: { boxShadow: '0px 8px 20px rgba(0, 88, 189, 0.16)' },
    default: {
      shadowColor: '#0058BD',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 6,
    },
  }),
  glowPrimary: Platform.select({
    web: { boxShadow: '0px 0px 10px rgba(0, 112, 236, 0.35)' },
    default: {
      shadowColor: '#0070EC',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
  }),
  glowSuccess: Platform.select({
    web: { boxShadow: '0px 0px 10px rgba(0, 110, 40, 0.3)' },
    default: {
      shadowColor: '#006E28',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
  }),
  glowDanger: Platform.select({
    web: { boxShadow: '0px 0px 10px rgba(186, 26, 26, 0.35)' },
    default: {
      shadowColor: '#BA1A1A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
  }),
};

export const GRADIENTS = {
  primary: ['#0058BD', '#0070EC'],
  primarySubtle: ['#F1F3FE', '#FFFFFF'],
  success: ['#006E28', '#34C759'],
  successSubtle: ['#ECFDF5', '#FFFFFF'],
  warning: ['#AC6300', '#FF9500'],
  warningSubtle: ['#FFFBEB', '#FFFFFF'],
  danger: ['#BA1A1A', '#FF3B30'],
  dangerSubtle: ['#FEF2F2', '#FFFFFF'],
  surfaceCard: ['#FFFFFF', '#F8FAFC'],
  accentPurple: ['#5856D6', '#AF52DE'],
  darkGlass: ['rgba(24, 27, 35, 0.92)', 'rgba(15, 18, 24, 0.98)'],
};

export const GAIT_BENCHMARKS = {
  symmetry: { min: 85, optimal: 95, unit: '%' },
  cadence: { min: 95, optimal: 112, max: 125, unit: 'spm' },
  stanceRatio: { stance: 60, swing: 40, unit: '%' },
  stepTimeVariation: { optimalMax: 5, unit: '%' },
};

export const CONFIG = {
  BUFFER_SIZE: 60,
  STORAGE_FLUSH_INTERVAL: 30000,
  STREAM_INTERVAL: 500,
  COP_SENSITIVITY: 1.2,
};

export const STORAGE_KEYS = {
  USER_PROFILE: '@gait_user_profile',
  DAILY_DATA: '@gait_daily_data',
  ALERTS: '@gait_alerts',
  PAIRED_DEVICES: '@gait_paired_devices',
  ONBOARDING_COMPLETED: '@gait_onboarding_completed',
  SETTINGS: '@gait_settings',
  GAIT_HISTORY: '@gait_history_v1',
  ACTIVE_SESSION: '@gait_active_session',
};
