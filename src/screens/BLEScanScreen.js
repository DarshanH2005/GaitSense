import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useBLE } from '../context/BLEContext';

const sideName = side => side === 'L' ? 'Left' : 'Right';

export default function BLEScanScreen({ navigation }) {
  const { completeOnboarding, hasCompletedOnboarding } = useUser();
  const ble = useBLE();
  const connected = side => ble[side === 'L' ? 'leftStatus' : 'rightStatus'] === 'connected';
  useEffect(() => { ble.startScan(); return () => ble.stopScan(); }, [ble.startScan, ble.stopScan]);
  const finish = async demo => {
    try {
      if (demo) await ble.setDemoMode(true);
      if (!hasCompletedOnboarding) await completeOnboarding();
      navigation?.goBack?.();
    } catch (_) { /* The context exposes the actionable error below. */ }
  };
  const renderItem = ({ item }) => {
    const status = ble[item.side === 'L' ? 'leftStatus' : 'rightStatus'];
    const busy = status === 'connecting' || status === 'discovering';
    return <View style={styles.card}><View style={styles.icon}><MaterialCommunityIcons name="shoe-print" size={25} color="#0058BD" /></View><View style={styles.info}><Text style={styles.name}>{item.name || `GaitInsole-${item.side}`}</Text><Text style={styles.meta}>{sideName(item.side)} foot · {Number.isFinite(item.rssi) ? `${item.rssi} dBm` : 'signal unavailable'}</Text></View><TouchableOpacity disabled={busy} style={[styles.button, connected(item.side) && styles.connected]} onPress={() => connected(item.side) ? ble.disconnectDevice(item.side) : ble.connectDevice(item.id, item.side)}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{connected(item.side) ? 'Disconnect' : 'Connect'}</Text>}</TouchableOpacity></View>;
  };
  const hasConnection = connected('L') || connected('R');
  return <SafeAreaView style={styles.page}><View style={styles.header}><TouchableOpacity onPress={() => navigation?.goBack?.()}><MaterialCommunityIcons name="arrow-left" size={25} color="#0058BD" /></TouchableOpacity><Text style={styles.title}>Insole pairing</Text><TouchableOpacity onPress={ble.startScan}><MaterialCommunityIcons name="refresh" size={24} color="#0058BD" /></TouchableOpacity></View><View style={styles.content}><Text style={styles.heading}>Discover nearby insoles</Text><Text style={styles.help}>Power on an insole, then connect it to its matching foot side. Battery level is not measured by this hardware.</Text>{ble.error ? <View style={styles.error}><Text style={styles.errorText}>{ble.error}</Text></View> : null}{ble.isScanning ? <View style={styles.scan}><ActivityIndicator color="#0058BD" /><Text style={styles.scanText}>Scanning for GaitInsole-L and GaitInsole-R…</Text></View> : null}<FlatList data={ble.discoveredDevices} keyExtractor={x => x.id} renderItem={renderItem} ListEmptyComponent={!ble.isScanning ? <Text style={styles.empty}>No compatible insole found. Check power, Bluetooth permissions, and distance, then rescan.</Text> : null} contentContainerStyle={styles.list} /><TouchableOpacity style={[styles.continue, !hasConnection && styles.disabled]} disabled={!hasConnection} onPress={() => finish(false)}><Text style={styles.continueText}>Continue with connected insoles</Text></TouchableOpacity><TouchableOpacity style={styles.demo} onPress={() => finish(true)}><Text style={styles.demoText}>Use clearly labelled demo simulation</Text></TouchableOpacity></View></SafeAreaView>;
}
const styles = StyleSheet.create({ page:{flex:1,backgroundColor:'#F9F9FF'},header:{height:58,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#fff'},title:{fontSize:18,fontWeight:'800',color:'#0058BD'},content:{flex:1,padding:20},heading:{fontSize:23,fontWeight:'800',color:'#181B23'},help:{marginTop:6,color:'#414755',lineHeight:20},scan:{flexDirection:'row',gap:9,alignItems:'center',marginVertical:20},scanText:{color:'#0058BD',fontWeight:'600'},list:{paddingVertical:8,gap:10},card:{backgroundColor:'#fff',borderWidth:1,borderColor:'#E6E8F3',borderRadius:16,padding:14,flexDirection:'row',alignItems:'center'},icon:{width:44,height:44,borderRadius:13,backgroundColor:'#E8F0FE',alignItems:'center',justifyContent:'center'},info:{flex:1,marginLeft:12},name:{fontWeight:'800',color:'#181B23'},meta:{fontSize:12,color:'#717786',marginTop:3},button:{backgroundColor:'#0058BD',paddingHorizontal:12,paddingVertical:9,borderRadius:18,minWidth:78,alignItems:'center'},connected:{backgroundColor:'#6B7280'},buttonText:{color:'#fff',fontWeight:'700',fontSize:12},error:{backgroundColor:'#FEE2E2',padding:12,borderRadius:10,marginTop:14},errorText:{color:'#991B1B'},empty:{textAlign:'center',color:'#717786',padding:28,lineHeight:20},continue:{backgroundColor:'#0058BD',borderRadius:26,padding:16,alignItems:'center'},disabled:{backgroundColor:'#C7CAD4'},continueText:{color:'#fff',fontWeight:'800'},demo:{alignItems:'center',padding:16},demoText:{color:'#0058BD',fontWeight:'700'} });
