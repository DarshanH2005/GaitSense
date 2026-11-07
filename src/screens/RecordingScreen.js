import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useGait } from '../context/GaitContext';

const labels = ['standing', 'normal', 'shuffle', 'limp', 'unsteady', 'toe_walk'];
export default function RecordingScreen({ navigation }) {
  const gait = useGait();
  const [participant, setParticipant] = useState('');
  const [label, setLabel] = useState('normal');
  const [busy, setBusy] = useState(false);
  const recording = gait.recording;
  const completed = gait.completedRecording;
  const start = () => { try { gait.startRecording(participant, label); } catch (e) { Alert.alert('Cannot start recording', e.message); } };
  const stop = () => gait.stopRecording();
  const exportRecording = async () => {
    if (!completed) return;
    setBusy(true);
    try {
      const uri = `${FileSystem.documentDirectory}${completed.id}.gaitsense.json`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify({ ...completed, exportedAt: new Date().toISOString(), sensorProtocol: 1 }, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is unavailable on this device. The file was saved locally.');
      await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Export labelled GaitSense session' });
      gait.discardRecording();
    } catch (e) { Alert.alert('Export not completed', e.message); } finally { setBusy(false); }
  };
  const importModel = async () => {
    setBusy(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true, multiple: false });
      if (picked.canceled) return;
      const asset = picked.assets?.[0];
      if (!asset) throw new Error('No model file selected.');
      if (asset.size && asset.size > 2 * 1024 * 1024) throw new Error('Model files must be smaller than 2 MB.');
      const text = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      await gait.installModel(JSON.parse(text));
      Alert.alert('Model imported', 'The validated model is ready for calibrated live windows.');
    } catch (e) { Alert.alert('Model import failed', e.message); } finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.page}><View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity><Text style={styles.title}>Data & model</Text><View /></View><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.card}><Text style={styles.heading}>Labelled data collection</Text><Text style={styles.note}>Only record real, calibrated dual-insole sessions. Demo records are retained as demo and must not be used for research training.</Text><Text style={styles.label}>Participant pseudonym</Text><TextInput value={participant} onChangeText={setParticipant} placeholder="Example: P001" autoCapitalize="characters" style={styles.input} editable={!recording && !completed} /><Text style={styles.label}>Activity label</Text><View style={styles.chips}>{labels.map(x => <TouchableOpacity key={x} disabled={!!recording || !!completed} onPress={() => setLabel(x)} style={[styles.chip, label === x && styles.chipOn]}><Text style={[styles.chipText, label === x && styles.chipTextOn]}>{x.replace('_', ' ')}</Text></TouchableOpacity>)}</View>{recording ? <><Text style={styles.status}>Recording {gait.recordingCount.toLocaleString()} packets</Text><TouchableOpacity style={[styles.action, styles.stop]} onPress={stop}><Text style={styles.actionText}>Stop recording</Text></TouchableOpacity></> : completed ? <><Text style={styles.status}>Recording ready: {completed.packets.length.toLocaleString()} packets</Text><TouchableOpacity disabled={busy} style={styles.action} onPress={exportRecording}><Text style={styles.actionText}>{busy ? 'Working…' : 'Export session JSON'}</Text></TouchableOpacity><TouchableOpacity onPress={gait.discardRecording}><Text style={styles.link}>Discard this recording</Text></TouchableOpacity></> : <TouchableOpacity style={styles.action} onPress={start}><Text style={styles.actionText}>Start recording</Text></TouchableOpacity>}</View>
    <View style={styles.card}><Text style={styles.heading}>On-device model</Text><Text style={styles.note}>{gait.modelName ? `Installed: ${gait.modelName}` : 'No trained model installed. Train a decision tree from exported real sessions, then import its JSON file.'}</Text><TouchableOpacity disabled={busy} style={styles.outline} onPress={importModel}><Text style={styles.outlineText}>Import validated model JSON</Text></TouchableOpacity>{gait.modelName ? <TouchableOpacity onPress={() => gait.removeModel()}><Text style={styles.link}>Remove installed model</Text></TouchableOpacity> : null}</View>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({page:{flex:1,backgroundColor:'#F9F9FF'},header:{height:56,paddingHorizontal:18,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{color:'#0058BD',fontWeight:'700'},title:{fontSize:18,fontWeight:'800',color:'#0058BD'},content:{padding:16,gap:14},card:{backgroundColor:'#fff',borderRadius:16,padding:16,borderWidth:1,borderColor:'#E6E8F3'},heading:{fontSize:17,fontWeight:'800',color:'#181B23'},note:{color:'#4B5563',lineHeight:19,marginTop:7},label:{fontWeight:'700',fontSize:12,marginTop:15,color:'#374151'},input:{borderWidth:1,borderColor:'#CBD5E1',borderRadius:10,padding:11,marginTop:6},chips:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:8},chip:{borderWidth:1,borderColor:'#CBD5E1',paddingHorizontal:9,paddingVertical:6,borderRadius:15},chipOn:{backgroundColor:'#0058BD',borderColor:'#0058BD'},chipText:{fontSize:12,color:'#374151'},chipTextOn:{color:'#fff',fontWeight:'700'},action:{marginTop:18,backgroundColor:'#0058BD',padding:14,borderRadius:24,alignItems:'center'},stop:{backgroundColor:'#BA1A1A'},actionText:{color:'#fff',fontWeight:'800'},status:{marginTop:17,fontWeight:'700',color:'#0058BD'},outline:{borderWidth:1,borderColor:'#0058BD',padding:13,borderRadius:24,alignItems:'center',marginTop:18},outlineText:{color:'#0058BD',fontWeight:'800'},link:{color:'#BA1A1A',fontWeight:'700',textAlign:'center',marginTop:14} });
