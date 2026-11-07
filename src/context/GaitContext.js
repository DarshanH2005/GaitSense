import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import StorageService from '../services/StorageService';
import { useBLE } from './BLEContext';
import { dateKey, emptyStats, stepDelta, distribution, symmetry } from '../core/metrics';
import { features, predict, validateModel, validWindow, LABELS } from '../core/model';
const GaitContext = createContext(null);
const fresh = () => ({ day: dateKey(), stats: emptyStats(), history: {}, alerts: [], latest: {}, previous: {}, buffers: { L: [], R: [] }, lastPrediction: {}, lastAlert: {}, dropped: { L: 0, R: 0 }, recording: null, completed: null, start: Date.now() });
export function GaitProvider({ children }) {
  const ble = useBLE(), state = useRef(fresh()), model = useRef(null), hydrated = useRef(false);
  const [view, setView] = useState({ ...state.current }), [modelName, setModelName] = useState(null), [storageError, setStorageError] = useState(null);
  const storageKey = `@gaitsense_v2_${ble.isDemoMode ? 'demo' : 'real'}`;
  const keyRef = useRef(storageKey); keyRef.current = storageKey;
  const flushChain = useRef(Promise.resolve());
  const flush = useCallback(() => {
    if (!hydrated.current) return Promise.resolve();
    const s = state.current, key = keyRef.current;
    const snapshot = { day: s.day, stats: { ...s.stats, counts: { ...s.stats.counts } }, history: { ...s.history, [s.day]: { ...s.stats, date: s.day } }, alerts: [...s.alerts] };
    flushChain.current = flushChain.current.catch(() => {}).then(() => StorageService.setItem(key, snapshot)).catch(e => setStorageError(e.message));
    return flushChain.current;
  }, []);
  useEffect(() => {
    let cancelled = false; hydrated.current = false; state.current = fresh(); setView({ ...state.current });
    (async () => {
      try {
        const saved = await StorageService.getItem(storageKey, null);
        if (cancelled) return;
        if (saved?.day && saved?.stats && saved?.history && Array.isArray(saved.alerts)) {
          state.current.history = { ...saved.history, [saved.day]: { ...saved.stats, date: saved.day } };
          state.current.alerts = saved.alerts;
          if (saved.day === dateKey()) state.current.stats = { ...emptyStats(), ...saved.stats };
        }
        const savedModel = await StorageService.getItem('@gaitsense_model_v1', null);
        if (cancelled) return;
        model.current = savedModel ? validateModel(savedModel) : null; setModelName(savedModel?.name || null);
      } catch (e) { if (!cancelled) setStorageError(e.message); }
      finally { if (!cancelled) { hydrated.current = true; setView({ ...state.current }); } }
    })();
    return () => { cancelled = true; };
  }, [storageKey]);
  const processIncomingPacket = useCallback(packet => {
    if (!hydrated.current) return;
    const s = state.current, side = packet.side, now = Date.now();
    const day = dateKey(now);
    if (day !== s.day) { s.history[s.day] = { ...s.stats, date: s.day }; s.stats = emptyStats(); s.day = day; }
    const delta = stepDelta(s.previous[side], packet); s.previous[side] = packet;
    const field = side === 'L' ? 'stepsLeft' : 'stepsRight';
    s.stats = { ...s.stats, [field]: s.stats[field] + delta };
    s.stats.totalSteps = s.stats.stepsLeft + s.stats.stepsRight;
    s.stats.symmetryScore = symmetry(s.stats.stepsLeft, s.stats.stepsRight);
    s.dropped[side] += packet.dropped || 0;
    let buffer = s.buffers[side];
    if (buffer.length && (buffer.at(-1).boot !== packet.boot || packet.ts <= buffer.at(-1).ts)) buffer = [];
    buffer.push(packet); s.buffers[side] = buffer.filter(p => packet.ts - p.ts <= 2000).slice(-130);
    let result = { class: 'unknown', conf: 0 };
    if (model.current && packet.ts - (s.lastPrediction[side]?.ts || 0) >= 1000) {
      if (validWindow(s.buffers[side])) {
        result = predict(model.current, features(s.buffers[side]));
        if (result.conf < 0.7) result.class = 'unknown';
        if (result.class !== 'unknown') {
          s.stats.counts = { ...s.stats.counts, [result.class]: (s.stats.counts[result.class] || 0) + 1 };
          Object.assign(s.stats, distribution(s.stats.counts));
          if (!['normal', 'standing'].includes(result.class) && now - (s.lastAlert[side] || 0) > 30000) {
            s.lastAlert[side] = now; s.stats.alertCount++;
            s.alerts = [{ id: `${now}-${side}`, ts: now, side, ...result, title: `${result.class.replace('_', ' ')} pattern`,
              description: 'Research model prediction; review the recorded session. This is not a diagnosis.', read: false, dismissed: false }, ...s.alerts].slice(0, 200);
          }
        }
      }
      s.lastPrediction[side] = { ...result, ts: packet.ts };
    }
    if (s.lastPrediction[side] && packet.ts - s.lastPrediction[side].ts < 1500 && packet.calibrated) result = s.lastPrediction[side];
    s.latest[side] = { ...packet, ...result, ts: packet.ts };
    if (s.recording) {
      s.recording.packets.push({ ...packet });
      if (s.recording.packets.length >= 60000 || now - s.recording.startedAt >= 600000) {
        s.completed = { ...s.recording, stoppedAt: now, stopReason: '10-minute/sample limit reached' }; s.recording = null;
      }
    }
  }, []);
  useEffect(() => ble.registerPacketListener(processIncomingPacket), [ble.registerPacketListener, processIncomingPacket]);
  useEffect(() => {
    const renderTimer = setInterval(() => {
      const s = state.current, now = Date.now();
      setView({ ...s, latest: { L: now - (s.latest.L?.receivedAt || 0) < 2000 ? s.latest.L : null, R: now - (s.latest.R?.receivedAt || 0) < 2000 ? s.latest.R : null },
        buffers: { L: [...s.buffers.L], R: [...s.buffers.R] }, dropped: { ...s.dropped }, recordingCount: s.recording?.packets.length || 0 });
    }, 200);
    const saveTimer = setInterval(flush, 10000);
    const sub = AppState.addEventListener('change', next => { if (next !== 'active') { const s = state.current; if (s.recording) { s.completed = { ...s.recording, stoppedAt: Date.now(), stopReason: 'App backgrounded' }; s.recording = null; } flush(); } });
    return () => { clearInterval(renderTimer); clearInterval(saveTimer); sub.remove(); flush(); };
  }, [flush]);
  const installModel = async m => { validateModel(m); await StorageService.setItem('@gaitsense_model_v1', m); model.current = m; state.current.lastPrediction = {}; setModelName(m.name || 'Imported model'); };
  const removeModel = async () => { await StorageService.removeItem('@gaitsense_model_v1'); model.current = null; state.current.lastPrediction = {}; setModelName(null); };
  const startRecording = (participant, label) => {
    const s = state.current;
    if (!participant.trim() || !LABELS.includes(label)) throw new Error('Enter participant ID and choose a label.');
    if (s.recording) throw new Error('A recording is already running.');
    if (s.completed) throw new Error('Export or discard the previous recording first.');
    if (!['L', 'R'].every(side => s.latest[side]?.calibrated && Date.now() - s.latest[side].receivedAt < 2000)) throw new Error('Connect and tare both insoles before recording.');
    s.recording = { version: 1, id: `session-${Date.now()}`, participant: participant.trim(), label, demo: ble.isDemoMode, startedAt: Date.now(), packets: [] };
  };
  const stopRecording = () => { const s = state.current; if (s.recording) { s.completed = { ...s.recording, stoppedAt: Date.now() }; s.recording = null; } };
  const changeMode = async enabled => { if (state.current.recording || state.current.completed) throw new Error('Export or discard the current recording before switching modes.'); await flush(); ble.setDemoMode(enabled); };
  const stats = view.stats;
  const historyData = { ...view.history, [view.day]: { ...stats, date: view.day } };
  const recentHistory = [...view.buffers.L, ...view.buffers.R].sort((a, b) => a.ts - b.ts);
  return <GaitContext.Provider value={{ latestLeft: view.latest.L, latestRight: view.latest.R, todayStats: stats, historyData, alerts: view.alerts,
    sessionDuration: Math.floor((Date.now() - view.start) / 1000), recentHistory, sessionStartTime: view.start,
    unreadAlertCount: view.alerts.filter(a => !a.read && !a.dismissed).length,
    dismissAlert: id => { state.current.alerts = state.current.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a); flush(); },
    markAllAlertsRead: () => { state.current.alerts = state.current.alerts.map(a => ({ ...a, read: true })); flush(); },
    refreshHistory: flush, calibrateSensors: (side = 'both') => ble.sendCommand(side, { type: 'calibrate' }),
    resetSessionSteps: () => { state.current.start = Date.now(); }, processIncomingPacket,
    exportHistoryAsCSV: () => { const fields = ['date', 'totalSteps', 'stepsLeft', 'stepsRight', 'symmetryScore', 'dominantClass', 'alertCount']; return [fields.join(','), ...Object.values(historyData).map(r => fields.map(k => r[k] ?? '').join(','))].join('\n'); },
    modelName, installModel, removeModel, startRecording, stopRecording, recording: view.recording, recordingCount: view.recordingCount || 0,
    completedRecording: view.completed, discardRecording: () => { state.current.completed = null; }, changeMode, dropped: view.dropped, storageError,
  }}>{children}</GaitContext.Provider>;
}
export function useGait() { const c = useContext(GaitContext); if (!c) throw new Error('GaitProvider missing'); return c; }
export default GaitContext;
