/**
 * StorageService
 * Manages persistent storage using @react-native-async-storage/async-storage
 * Includes safe JSON serialization/deserialization, in-memory caching fallback, and helper methods.
 */

import { STORAGE_KEYS } from '../utils/constants.js';

// Safe lazy loading of AsyncStorage to prevent crash when module is missing or in mock environments
let AsyncStorage = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default || require('@react-native-async-storage/async-storage');
} catch (e) {
  // In-memory fallback
}

// In-memory fallback dictionary
const memoryFallback = new Map();

/**
 * Low-level safe storage wrapper
 */
const SafeStorage = {
  async getItem(key) {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const item = await AsyncStorage.getItem(key);
        if (item !== null && item !== undefined) return item;
      }
    } catch (e) {
      console.warn(`[StorageService] Error reading key "${key}":`, e);
    }
    return memoryFallback.get(key) || null;
  },

  async setItem(key, value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, stringValue);
      }
    } catch (e) {
      console.warn(`[StorageService] Error writing key "${key}":`, e);
    }
    memoryFallback.set(key, stringValue);
  },

  async removeItem(key) {
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[StorageService] Error removing key "${key}":`, e);
    }
    memoryFallback.delete(key);
  },

  async clear() {
    try {
      if (AsyncStorage && typeof AsyncStorage.clear === 'function') {
        await AsyncStorage.clear();
      }
    } catch (e) {
      console.warn('[StorageService] Error in clear:', e);
    }
    memoryFallback.clear();
  },
};

/**
 * Safe JSON parser with default fallback
 */
function safeJsonParse(jsonString, fallback = null) {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallback;
  }
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    return jsonString; // return string directly if not valid JSON
  }
}

export const StorageService = {
  // Generic key-value methods
  async getItem(key, fallback = null) {
    const raw = await SafeStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return safeJsonParse(raw, fallback);
  },

  async setItem(key, value) {
    await SafeStorage.setItem(key, value);
    return value;
  },

  async removeItem(key) {
    await SafeStorage.removeItem(key);
  },

  async clear() {
    await SafeStorage.clear();
  },

  // ==========================================
  // USER PROFILE
  // ==========================================
  async getUserProfile() {
    const raw = await SafeStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return safeJsonParse(raw, {
      name: 'Eleanor Vance',
      age: 68,
      gender: 'Female',
      heightCm: 165,
      weightKg: 64,
      conditions: ["parkinsons"],
    });
  },

  async setUserProfile(profile) {
    await SafeStorage.setItem(STORAGE_KEYS.USER_PROFILE, profile);
    return profile;
  },

  async updateUserProfile(partialProfile) {
    const current = (await this.getUserProfile()) || {};
    const updated = { ...current, ...partialProfile };
    await this.setUserProfile(updated);
    return updated;
  },

  // ==========================================
  // ONBOARDING & SETTINGS
  // ==========================================
  async getOnboardingCompleted() {
    const raw = await SafeStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return raw === 'true' || raw === true;
  },

  async setOnboardingCompleted(completed = true) {
    await SafeStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
  },

  async getSettings() {
    const raw = await SafeStorage.getItem(STORAGE_KEYS.SETTINGS);
    return safeJsonParse(raw, {
      sensitivity: 0.85,
      monitoringInterval: 'continuous',
      darkMode: false,
      soundAlerts: true,
      hapticFeedback: true,
    });
  },

  async updateSettings(partialSettings) {
    const current = await this.getSettings();
    const updated = { ...current, ...partialSettings };
    await SafeStorage.setItem(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // ==========================================
  // DAILY DATA & ALERTS
  // ==========================================
  async getAllDailyData() {
    const raw = await SafeStorage.getItem(STORAGE_KEYS.DAILY_DATA);
    return safeJsonParse(raw, {});
  },

  async setDailyRecord(dateKey, record) {
    const all = await this.getAllDailyData();
    all[dateKey] = record;
    await SafeStorage.setItem(STORAGE_KEYS.DAILY_DATA, all);
    return all;
  },

  async getAlerts() {
    const raw = await SafeStorage.getItem(STORAGE_KEYS.ALERTS);
    return safeJsonParse(raw, []);
  },

  async saveAlert(alert) {
    const alerts = await this.getAlerts();
    const updated = [alert, ...alerts].slice(0, 100);
    await SafeStorage.setItem(STORAGE_KEYS.ALERTS, updated);
    return updated;
  },
};

// Aliased StorageKeys export for backwards compatibility
export const StorageKeys = {
  ...STORAGE_KEYS,
  ONBOARDING_STATUS: STORAGE_KEYS.ONBOARDING_COMPLETED || '@gait_onboarding_completed',
  APP_SETTINGS: STORAGE_KEYS.SETTINGS || '@gait_settings',
};

export { STORAGE_KEYS };
export default StorageService;
