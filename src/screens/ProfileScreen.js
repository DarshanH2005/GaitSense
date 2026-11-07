import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useBLE } from '../context/BLEContext';
import { useGait } from '../context/GaitContext';
import { COLORS, SHADOWS } from '../utils/constants';

const KNOWN_CONDITIONS_LIST = [
  { id: 'parkinsons', label: "Parkinson's Disease", icon: 'brain' },
  { id: 'neuropathy', label: 'Peripheral Neuropathy', icon: 'lightning-bolt' },
  { id: 'arthritis', label: 'Knee Osteoarthritis', icon: 'bone' },
  { id: 'post_surgery', label: 'Post-Surgery Rehab', icon: 'hospital-box' },
  { id: 'none', label: 'Preventive Screening', icon: 'shield-check' },
];

export default function ProfileScreen({ navigation }) {
  const { profile, updateProfile, settings, updateSettings, toggleCondition } = useUser ? useUser() : {};
  const { isDemoMode } = useBLE ? useBLE() : {};
  const { calibrateSensors, exportHistoryAsCSV, changeMode } = useGait ? useGait() : {};

  // Form state
  const [patientName, setPatientName] = useState(profile?.name || 'Eleanor Vance');
  const [patientAge, setPatientAge] = useState(String(profile?.age || '68'));
  const [patientWeight, setPatientWeight] = useState(String(profile?.weightKg || '64'));
  const [patientHeight, setPatientHeight] = useState(String(profile?.heightCm || '165'));

  const weightNum = parseFloat(patientWeight) || 64;
  const heightNum = parseFloat(patientHeight) || 165;
  const bmi = heightNum > 0 ? (weightNum / Math.pow(heightNum / 100, 2)).toFixed(1) : '23.5';

  const handleSaveProfile = () => {
    if (updateProfile) {
      updateProfile({
        name: patientName,
        age: parseInt(patientAge, 10) || 68,
        weightKg: parseFloat(patientWeight) || 64,
        heightCm: parseFloat(patientHeight) || 165,
      });
    }
    Alert.alert('Profile Saved', 'Patient metrics and biometric baselines updated.');
  };

  const handleRecalibrate = async (side) => {
    try { if (calibrateSensors) await calibrateSensors(side); Alert.alert('Tare command sent', 'Keep the FSRs unloaded. Wait for fresh calibrated telemetry before recording.'); }
    catch (e) { Alert.alert('Unable to tare', e.message); }
  };

  const handleExportCSV = () => {
    if (exportHistoryAsCSV) exportHistoryAsCSV();
    Alert.alert(
      'Export Biometrics CSV',
      'Compiled 7-day raw FSR force channels, IMU kinematic time-series, and classification timestamps.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FF" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.goBack?.()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0058BD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient & Hardware</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSaveProfile}>
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Passport Card */}
        <View style={styles.card}>
          <View style={styles.passportHeader}>
            <View style={styles.avatarBox}>
              <MaterialCommunityIcons name="account" size={32} color="#0058BD" />
            </View>
            <View style={styles.avatarMeta}>
              <Text style={styles.patientNameTitle}>{patientName}</Text>
              <Text style={styles.patientIdText}>ID: GS-PT-8842 • Female • {patientAge} yrs</Text>
            </View>
            <View style={styles.bmiBadge}>
              <Text style={styles.bmiText}>BMI {bmi}</Text>
            </View>
          </View>

          <View style={styles.inputGrid}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Name"
              />
            </View>

            <View style={styles.inputRowTriple}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.textInput}
                  value={patientAge}
                  onChangeText={setPatientAge}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  value={patientWeight}
                  onChangeText={setPatientWeight}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.textInput}
                  value={patientHeight}
                  onChangeText={setPatientHeight}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Clinical Diagnoses / Known Conditions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medical Indications</Text>
          <Text style={styles.cardSubtitle}>Flags disorder-specific gait anomaly classifiers</Text>

          <View style={styles.conditionsGrid}>
            {KNOWN_CONDITIONS_LIST.map((cond) => {
              const isSelected = (profile?.conditions || ['parkinsons']).includes(cond.id);
              return (
                <TouchableOpacity
                  key={cond.id}
                  style={[styles.conditionChip, isSelected && styles.conditionChipSelected]}
                  onPress={() => toggleCondition && toggleCondition(cond.id)}
                >
                  <MaterialCommunityIcons
                    name={cond.icon}
                    size={16}
                    color={isSelected ? '#FFFFFF' : '#0058BD'}
                  />
                  <Text style={[styles.conditionChipText, isSelected && styles.conditionChipTextSelected]}>
                    {cond.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Insole Hardware Management Deck */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Insole Hardware Deck</Text>
          <Text style={styles.cardSubtitle}>Dual ESP32 BLE 5.2 Microcontrollers</Text>

          <View style={styles.hardwareCardsRow}>
            {/* Left Insole */}
            <View style={styles.hwInsoleCard}>
              <View style={styles.hwTop}>
                <View style={styles.hwSideCircle}>
                  <Text style={styles.hwSideText}>L</Text>
                </View>
                <View style={styles.hwStatusPill}>
                  <MaterialCommunityIcons name="battery-high" size={12} color="#006E28" />
                  <Text style={styles.hwStatusText}>94%</Text>
                </View>
              </View>
              <Text style={styles.hwDevName}>GaitInsole-L_4A2F</Text>
              <View style={styles.hwMetaRow}>
                <MaterialCommunityIcons name="signal" size={11} color="#0058BD" />
                <Text style={styles.hwMeta}>-58 dBm • v1.0.4</Text>
              </View>
              <TouchableOpacity
                style={styles.tareActionBtn}
                onPress={() => handleRecalibrate('L')}
              >
                <Text style={styles.tareActionText}>Zero-Tare</Text>
              </TouchableOpacity>
            </View>

            {/* Right Insole */}
            <View style={styles.hwInsoleCard}>
              <View style={styles.hwTop}>
                <View style={[styles.hwSideCircle, { backgroundColor: '#0070EC' }]}>
                  <Text style={styles.hwSideText}>R</Text>
                </View>
                <View style={styles.hwStatusPill}>
                  <MaterialCommunityIcons name="battery-high" size={12} color="#006E28" />
                  <Text style={styles.hwStatusText}>88%</Text>
                </View>
              </View>
              <Text style={styles.hwDevName}>GaitInsole-R_9C1B</Text>
              <View style={styles.hwMetaRow}>
                <MaterialCommunityIcons name="signal" size={11} color="#0058BD" />
                <Text style={styles.hwMeta}>-64 dBm • v1.0.4</Text>
              </View>
              <TouchableOpacity
                style={styles.tareActionBtn}
                onPress={() => handleRecalibrate('R')}
              >
                <Text style={styles.tareActionText}>Zero-Tare</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Simulation & Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings & Diagnostics</Text>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>Demo Simulation Streaming</Text>
              <Text style={styles.settingDesc}>Simulates 500ms multi-sensor gait telemetry</Text>
            </View>
            <Switch
              value={isDemoMode}
              onValueChange={async v => { try { await changeMode(v); } catch (e) { Alert.alert('Cannot change mode', e.message); } }}
              trackColor={{ false: '#C1C6D7', true: '#0058BD' }}
            />
          </View>
        </View>

        {/* Report & Data Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.csvExportBtn} onPress={() => navigation?.navigate('Recording')}>
            <MaterialCommunityIcons name="database-cog-outline" size={18} color="#0058BD" />
            <Text style={styles.csvExportBtnText}>Record Data & Manage ML Model</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryReportBtn}
            onPress={() => navigation?.navigate('Report')}
          >
            <MaterialCommunityIcons name="file-document-edit-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryReportBtnText}>Generate Clinical Summary Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.csvExportBtn} onPress={handleExportCSV}>
            <MaterialCommunityIcons name="database-export" size={18} color="#0058BD" />
            <Text style={styles.csvExportBtnText}>Export Raw Telemetry (.CSV)</Text>
          </TouchableOpacity>
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
  saveHeaderBtn: {
    backgroundColor: '#0058BD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  saveHeaderText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF9',
    ...SHADOWS.card,
  },
  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F3FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMeta: {
    flex: 1,
  },
  patientNameTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '800',
    color: '#181B23',
  },
  patientIdText: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#717786',
    marginTop: 2,
  },
  bmiBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bmiText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '800',
    color: '#006E28',
  },
  inputGrid: {
    gap: 10,
  },
  inputGroup: {},
  inputLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: '#414755',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F9F9FF',
    borderWidth: 1,
    borderColor: '#E0E2ED',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#181B23',
  },
  inputRowTriple: {
    flexDirection: 'row',
    gap: 8,
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
    marginBottom: 12,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F1F3FE',
    borderWidth: 1,
    borderColor: '#E0E2ED',
  },
  conditionChipSelected: {
    backgroundColor: '#0058BD',
    borderColor: '#0058BD',
  },
  conditionChipText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#414755',
  },
  conditionChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hardwareCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  hwInsoleCard: {
    flex: 1,
    backgroundColor: '#F9F9FF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E2ED',
  },
  hwTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hwSideCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0058BD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hwSideText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  hwStatusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hwStatusText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#006E28',
  },
  hwDevName: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: '#181B23',
  },
  hwMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hwMeta: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#717786',
  },
  tareActionBtn: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0058BD',
  },
  tareActionText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: '#0058BD',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#181B23',
  },
  settingDesc: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#717786',
    marginTop: 2,
  },
  actionsContainer: {
    gap: 10,
  },
  primaryReportBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0058BD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.floating,
  },
  primaryReportBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  csvExportBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0058BD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  csvExportBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#0058BD',
  },
});
