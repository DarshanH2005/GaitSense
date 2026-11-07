import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import BLEService from '../services/BLEService';
export const BLEContext = createContext(null);
export function BLEProvider({ children }) {
  const [isDemoMode, setMode] = useState(false);
  const mode = useRef(false), epoch = useRef(0), listeners = useRef(new Set());
  const [isScanning, setScanning] = useState(false), [discoveredDevices, setDevices] = useState([]), [error, setError] = useState(null);
  const [devices, setConnected] = useState({ L: null, R: null });
  const [statuses, setStatuses] = useState({ L: 'disconnected', R: 'disconnected' });
  const devicesRef = useRef(devices); devicesRef.current = devices;
  const statusRef = useRef(statuses); statusRef.current = statuses;
  const dispatch = useCallback(p => listeners.current.forEach(fn => fn(p)), []);
  const registerPacketListener = useCallback(fn => { listeners.current.add(fn); return () => listeners.current.delete(fn); }, []);
  const stopScan = useCallback(() => { BLEService.stopScan(); setScanning(false); }, []);
  const setDemoMode = useCallback(enabled => {
    epoch.current++; mode.current = Boolean(enabled); BLEService.disconnectAll();
    setMode(Boolean(enabled)); setScanning(false); setError(null); setDevices([]);
    setStatuses({ L: enabled ? 'connected' : 'disconnected', R: enabled ? 'connected' : 'disconnected' });
    setConnected(enabled ? { L: { id: 'demo-L', name: 'Demo left', side: 'L' }, R: { id: 'demo-R', name: 'Demo right', side: 'R' } } : { L: null, R: null });
  }, []);
  const startScan = useCallback(async () => {
    const token = epoch.current; setDevices([]); setError(null); setScanning(true);
    if (mode.current) { setDevices(['L', 'R'].map(side => ({ id: `demo-${side}`, name: `Demo ${side}`, side }))); setScanning(false); return; }
    try {
      await BLEService.startScan(d => { if (token === epoch.current) setDevices(old => [...old.filter(x => x.id !== d.id), d]); },
        e => { if (token === epoch.current) setError(e.message); }, () => setScanning(false));
      if (token !== epoch.current) stopScan();
    } catch (e) { setError(e.message); setScanning(false); }
  }, [stopScan]);
  const connectDevice = useCallback(async (id, side) => {
    const token = epoch.current; stopScan(); setError(null);
    setConnected(old => ({ ...old, [side]: { id, side, name: `GaitInsole-${side}` } }));
    if (mode.current) { setStatuses(old => ({ ...old, [side]: 'connected' })); return true; }
    try {
      await BLEService.connect(id, side, p => { if (epoch.current === token) dispatch(p); }, (status, message) => {
        if (epoch.current !== token) return;
        setStatuses(old => old[side] === status ? old : { ...old, [side]: status });
        if (message) setError(message);
      }); return true;
    } catch (e) { setError(e.message); return false; }
  }, [dispatch, stopScan]);
  const disconnectDevice = useCallback(async side => { await BLEService.disconnectSide(side); setStatuses(old => ({ ...old, [side]: 'disconnected' })); }, []);
  const sendCommand = useCallback(async (side, object) => {
    try {
      if ((object.type || object.cmd) !== 'calibrate') throw new Error('Unsupported hardware command');
      if (mode.current) return true;
      for (const s of side === 'both' ? ['L', 'R'] : [side]) {
        if (statusRef.current[s] !== 'connected') throw new Error(`Connect the ${s} insole first`);
        await BLEService.sendCommand(s, 'tare');
      }
      return true;
    } catch (e) { setError(e.message); throw e; }
  }, []);
  useEffect(() => {
    if (!isDemoMode) return;
    const start = Date.now(); let seq = 0;
    const timer = setInterval(() => {
      const now = Date.now(), t = (now - start) / 1000;
      for (const side of ['L', 'R']) {
        if (statusRef.current[side] !== 'connected') continue;
        const wave = Math.max(0, Math.sin(t * Math.PI * 2 + (side === 'R' ? Math.PI : 0)));
        dispatch({ version: 1, side, seq, boot: start, deviceMs: now - start, ts: now, receivedAt: now, dropped: 0, calibrated: true, demo: true,
          fsr: [3000, 1100, 2500, 2200].map(x => Math.round(x * wave)), adc: [0, 0, 0, 0],
          ax: wave * 0.4, ay: 0, az: 1, gx: wave * 30, gy: 0, gz: 0, steps: Math.floor(t), class: 'unknown', conf: 0, alert: false });
      }
      seq = (seq + 1) % 65536;
    }, 20);
    return () => clearInterval(timer);
  }, [isDemoMode, dispatch]);
  useEffect(() => () => { epoch.current++; BLEService.disconnectAll(); }, []);
  return <BLEContext.Provider value={{ isDemoMode, isScanning, discoveredDevices, error, leftDevice: devices.L, rightDevice: devices.R,
    leftStatus: statuses.L, rightStatus: statuses.R, isBleAvailable: BLEService.isSupported, startScan, stopScan, connectDevice, disconnectDevice,
    sendCommand, setDemoMode, toggleDemoMode: () => setDemoMode(!mode.current), registerPacketListener,
    reconnect: side => devicesRef.current[side] && connectDevice(devicesRef.current[side].id, side) }}>{children}</BLEContext.Provider>;
}
export function useBLE() { const value = useContext(BLEContext); if (!value) throw new Error('BLEProvider missing'); return value; }
export default BLEContext;
