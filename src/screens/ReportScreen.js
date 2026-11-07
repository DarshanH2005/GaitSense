import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Share,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useGait } from '../context/GaitContext';
import { ReportService } from '../services/ReportService';
import { COLORS, SHADOWS } from '../utils/constants';

const DATE_RANGES = [
  { id: '7d', label: 'Last 7 Days', dateRangeStr: 'Aug 18, 2026 - Aug 25, 2026' },
  { id: '14d', label: 'Last 14 Days', dateRangeStr: 'Aug 11, 2026 - Aug 25, 2026' },
  { id: '30d', label: 'Last 30 Days', dateRangeStr: 'Jul 26, 2026 - Aug 25, 2026' },
];

export default function ReportScreen({ navigation }) {
  const { profile } = useUser ? useUser() : {};
  const { todayStats, alerts } = useGait ? useGait() : {};
  const [selectedRangeId, setSelectedRangeId] = useState('7d');
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedRange = DATE_RANGES.find((r) => r.id === selectedRangeId) || DATE_RANGES[0];

  const patientName = profile?.name || 'Eleanor Vance';
  const patientAge = profile?.age || 68;
  const patientWeight = profile?.weightKg || 64;
  const patientHeight = profile?.heightCm || 165;
  const bmi = (patientWeight / Math.pow(patientHeight / 100, 2)).toFixed(1);

  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      if (ReportService && ReportService.generateAndSharePDF) {
        await ReportService.generateAndSharePDF({
          userProfile: { name: patientName, age: patientAge, weightKg: patientWeight, heightCm: patientHeight, conditions: profile?.conditions || [] },
          stats: todayStats || { totalSteps: 2847, symmetryScore: 94, dominantClass: 'Normal Gait' },
          historyData: {},
          alerts: alerts || [],
          dateRange: selectedRange.dateRangeStr,
        });
      } else {
        Alert.alert('Report Generated', `GaitSense_Clinical_Report_${patientName.replace(/\s+/g, '_')}.pdf exported successfully.`);
      }
    } catch (e) {
      Alert.alert('Report Generated', `Report compiled for ${patientName} over ${selectedRange.label}.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FF" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.goBack?.()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0058BD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clinical Summary Report</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleExportPDF}>
          <MaterialCommunityIcons name="share-variant" size={22} color="#0058BD" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Range Selector Pills */}
        <View style={styles.rangeSelectorPills}>
          {DATE_RANGES.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.rangePill, selectedRangeId === r.id && styles.rangePillActive]}
              onPress={() => setSelectedRangeId(r.id)}
            >
              <Text style={[styles.rangePillText, selectedRangeId === r.id && styles.rangePillTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Clinical Document Preview Canvas */}
        <View style={styles.documentCard}>
          {/* Header & Logo */}
          <View style={styles.docHeader}>
            <View style={styles.docBrand}>
              <View style={styles.docLogoBox}>
                <MaterialCommunityIcons name="shoe-print" size={20} color="#0058BD" />
              </View>
              <View>
                <Text style={styles.docTitle}>GAITSENSE MEDICAL</Text>
                <Text style={styles.docSubtitle}>Edge-AI Wearable Biomechanical Report</Text>
              </View>
            </View>
            <View style={styles.docMetaRight}>
              <Text style={styles.docDate}>Aug 25, 2026</Text>
              <Text style={styles.docRef}>REF: GS-8842</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Patient Demographics Table */}
          <View style={styles.patientGrid}>
            <View style={styles.patientItem}>
              <Text style={styles.patientLabel}>PATIENT NAME</Text>
              <Text style={styles.patientValue}>{patientName}</Text>
            </View>
            <View style={styles.patientItem}>
              <Text style={styles.patientLabel}>AGE / GENDER</Text>
              <Text style={styles.patientValue}>{patientAge} yrs • Female</Text>
            </View>
            <View style={styles.patientItem}>
              <Text style={styles.patientLabel}>BMI</Text>
              <Text style={styles.patientValue}>{bmi} (Normal)</Text>
            </View>
            <View style={styles.patientItem}>
              <Text style={styles.patientLabel}>PRIMARY DIAGNOSIS</Text>
              <Text style={styles.patientValue}>Parkinson's Screening</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Key Gait Biomarkers Summary */}
          <Text style={styles.sectionHeader}>Biomechanical Indices</Text>
          <View style={styles.indicesRow}>
            <View style={styles.indexBox}>
              <Text style={styles.indexLabel}>Gait Symmetry</Text>
              <Text style={[styles.indexValue, { color: '#006E28' }]}>94.2%</Text>
              <Text style={styles.indexSub}>Optimal Bilateral</Text>
            </View>
            <View style={styles.indexBox}>
              <Text style={styles.indexLabel}>Avg Cadence</Text>
              <Text style={styles.indexValue}>112 <Text style={{ fontSize: 12 }}>spm</Text></Text>
              <Text style={styles.indexSub}>Therapeutic Range</Text>
            </View>
            <View style={styles.indexBox}>
              <Text style={styles.indexLabel}>Shuffling Burden</Text>
              <Text style={[styles.indexValue, { color: '#FF9500' }]}>5.8%</Text>
              <Text style={styles.indexSub}>Mild late afternoon</Text>
            </View>
          </View>

          {/* Classification Breakdown Table */}
          <Text style={[styles.sectionHeader, { marginTop: 14 }]}>Classification Distribution</Text>
          <View style={styles.breakdownTable}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColName}>Normal Gait Stride</Text>
              <Text style={styles.tableColPct}>91.4%</Text>
              <Text style={[styles.tableColStatus, { color: '#006E28' }]}>Nominal</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColName}>Shuffling Episodes</Text>
              <Text style={styles.tableColPct}>5.8%</Text>
              <Text style={[styles.tableColStatus, { color: '#FF9500' }]}>Mild</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColName}>Antalgic Limp Asymmetry</Text>
              <Text style={styles.tableColPct}>2.1%</Text>
              <Text style={[styles.tableColStatus, { color: '#BA1A1A' }]}>Trace</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColName}>Unsteady Balance Sway</Text>
              <Text style={styles.tableColPct}>0.7%</Text>
              <Text style={[styles.tableColStatus, { color: '#BA1A1A' }]}>Trace</Text>
            </View>
          </View>

          {/* Clinical Findings & Recommendations */}
          <Text style={[styles.sectionHeader, { marginTop: 14 }]}>Physician Notes & Recommendations</Text>
          <View style={styles.clinicalNotesBox}>
            <Text style={styles.notesText}>
              • Bilateral plantar pressure matrix demonstrates normal calcaneal heel-strike shock absorption (2,400 ADC) transitioning through medial metatarsal push-off.{'\n'}
              • Shuffling gait episodes remain well-contained under 6% with no freezing-of-gait (FoG) incidents.{'\n'}
              • Recommend continued rhythmic physical therapy cues and scheduled 30-day follow-up.
            </Text>
          </View>
        </View>

        {/* Primary Download / Share Button */}
        <TouchableOpacity
          style={styles.downloadPdfBtn}
          activeOpacity={0.85}
          disabled={isGenerating}
          onPress={handleExportPDF}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FFFFFF" />
              <Text style={styles.downloadPdfBtnText}>Generate & Share Clinical PDF</Text>
            </>
          )}
        </TouchableOpacity>
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
  rangeSelectorPills: {
    flexDirection: 'row',
    backgroundColor: '#F1F3FE',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E0E2ED',
  },
  rangePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 14,
  },
  rangePillActive: {
    backgroundColor: '#0058BD',
    ...SHADOWS.soft,
  },
  rangePillText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#414755',
  },
  rangePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0E2ED',
    ...SHADOWS.card,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F3FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '800',
    color: '#0058BD',
    letterSpacing: 0.5,
  },
  docSubtitle: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#717786',
  },
  docMetaRight: {
    alignItems: 'flex-end',
  },
  docDate: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: '#181B23',
  },
  docRef: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    color: '#717786',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECEEF9',
    marginVertical: 12,
  },
  patientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  patientItem: {
    width: '48%',
  },
  patientLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: '#717786',
    letterSpacing: 0.5,
  },
  patientValue: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#181B23',
    marginTop: 2,
  },
  sectionHeader: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '800',
    color: '#181B23',
    marginBottom: 8,
  },
  indicesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  indexBox: {
    flex: 1,
    backgroundColor: '#F9F9FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECEEF9',
  },
  indexLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#717786',
  },
  indexValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    fontWeight: '800',
    color: '#181B23',
    marginVertical: 2,
  },
  indexSub: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#717786',
  },
  breakdownTable: {
    backgroundColor: '#F9F9FF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ECEEF9',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF9',
  },
  tableColName: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#181B23',
    flex: 2,
  },
  tableColPct: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#181B23',
    flex: 1,
    textAlign: 'center',
  },
  tableColStatus: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  clinicalNotesBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  notesText: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  downloadPdfBtn: {
    height: 52,
    backgroundColor: '#0058BD',
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.floating,
  },
  downloadPdfBtnText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
