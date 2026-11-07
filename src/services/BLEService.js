import { Platform, PermissionsAndroid } from 'react-native';
import { BLE_CONFIG as C } from '../utils/constants';
import { createDecoder, createClock, encode64 } from '../core/protocol';
class BLEServiceClass {
  manager = null; scans = null; connections = new Map();
  get isSupported() { return Platform.OS !== 'web'; }
  init() {
    if (!this.isSupported) throw new Error('Real BLE needs an Android or iOS development build. Use demo on web.');
    if (!this.manager) {
      try { const { BleManager } = require('react-native-ble-plx'); this.manager = new BleManager(); }
      catch { throw new Error('Install the development APK; native BLE is unavailable in Expo Go.'); }
    }
    return this.manager;
  }
  async ready() {
    const manager = this.init();
    if (Platform.OS === 'android') {
      const keys = Platform.Version >= 31 ? ['BLUETOOTH_SCAN', 'BLUETOOTH_CONNECT'] : ['ACCESS_FINE_LOCATION'];
      const permissions = keys.map(k => PermissionsAndroid.PERMISSIONS[k]);
      const result = await PermissionsAndroid.requestMultiple(permissions);
      if (permissions.some(p => result[p] !== PermissionsAndroid.RESULTS.GRANTED)) throw new Error('Bluetooth permission denied. Enable it in system settings.');
    }
    const state = await manager.state();
    if (state !== 'PoweredOn') throw new Error(`Bluetooth is ${state}. Turn it on and retry.`);
    return manager;
  }
  async startScan(onDevice, onError, onDone) {
    this.stopScan(); const manager = await this.ready();
    manager.startDeviceScan([C.SERVICE_UUID], { allowDuplicates: false }, (error, device) => {
      if (error) { this.stopScan(); onError(error); onDone(); return; }
      const name = device?.name || device?.localName || '';
      const side = name.startsWith(C.DEVICE_PREFIXES.LEFT) ? 'L' : name.startsWith(C.DEVICE_PREFIXES.RIGHT) ? 'R' : null;
      if (side) onDevice({ id: device.id, name, side, rssi: device.rssi });
    });
    this.scans = setTimeout(() => { this.stopScan(); onDone(); }, C.SCAN_TIMEOUT_MS);
  }
  stopScan() { clearTimeout(this.scans); this.scans = null; this.manager?.stopDeviceScan(); }
  async connect(id, side, onPacket, onStatus) {
    await this.disconnectSide(side);
    const entry = { id, side, cancelled: false, attempts: 0, sub: null, disconnectSub: null, timer: null };
    this.connections.set(side, entry);
    const retry = message => {
      if (entry.cancelled) return;
      if (entry.attempts >= C.MAX_RECONNECT_ATTEMPTS) { onStatus('error', `${message}. Reconnect manually.`); return; }
      onStatus('disconnected', `${message}. Retrying…`); clearTimeout(entry.timer);
      entry.timer = setTimeout(establish, Math.min(15000, 1000 * 2 ** entry.attempts++));
    };
    const establish = async () => {
      if (entry.cancelled) return; onStatus('connecting');
      try {
        const manager = await this.ready(); if (entry.cancelled) return;
        const device = await manager.connectToDevice(id, { timeout: 12000 });
        if (entry.cancelled) { await manager.cancelDeviceConnection(id); return; }
        await device.discoverAllServicesAndCharacteristics();
        if (entry.cancelled) { await manager.cancelDeviceConnection(id); return; }
        const decode = createDecoder(side), clock = createClock();
        entry.sub?.remove(); entry.disconnectSub?.remove();
        entry.sub = device.monitorCharacteristicForService(C.SERVICE_UUID, C.GAIT_DATA_CHAR_UUID, (error, c) => {
          if (entry.cancelled) return;
          if (error) { onStatus('error', error.message); return; }
          try {
            const packet = c?.value && decode(c.value), aligned = packet && clock(packet);
            if (aligned) { onPacket(aligned); entry.attempts = 0; onStatus('connected'); }
          } catch (e) { onStatus('error', e.message); }
        });
        entry.disconnectSub = manager.onDeviceDisconnected(id, () => { entry.sub?.remove(); if (!entry.cancelled) retry('Connection lost'); });
        onStatus('connected');
      } catch (e) { if (!entry.cancelled) retry(e.message); }
    };
    await establish();
  }
  async disconnectSide(side) {
    const e = this.connections.get(side); if (!e) return;
    e.cancelled = true; clearTimeout(e.timer); e.sub?.remove(); e.disconnectSub?.remove(); this.connections.delete(side);
    try { await this.manager?.cancelDeviceConnection(e.id); } catch {}
  }
  async sendCommand(side, command) {
    const e = this.connections.get(side); if (!e || e.cancelled) throw new Error(`${side} insole is not connected`);
    await this.manager.writeCharacteristicWithResponseForDevice(e.id, C.SERVICE_UUID, C.COMMAND_CHAR_UUID, encode64(Uint8Array.from(command.split('').map(c => c.charCodeAt(0)))));
  }
  async disconnectAll() { this.stopScan(); await Promise.all(['L', 'R'].map(s => this.disconnectSide(s))); }
}
export const BLEService = new BLEServiceClass();
export default BLEService;
