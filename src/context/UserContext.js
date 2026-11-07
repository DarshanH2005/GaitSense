/**
 * @file UserContext.js
 * @description React Context for user demographics, clinical conditions, system settings,
 * onboarding lifecycle, and persistent synchronization via StorageService.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import StorageService, { StorageKeys } from '../services/StorageService';

/**
 * @typedef {Object} UserProfile
 * @property {string} name - Full user name
 * @property {number} age - User age in years
 * @property {number} weightKg - Weight in kilograms
 * @property {number} heightCm - Height in centimeters
 * @property {string[]} conditions - Array of medical diagnoses (e.g. "Parkinson's", "Neuropathy", "Stroke Recovery")
 * @property {string} doctorEmail - Physician or caregiver email for report sharing
 * @property {string} notes - General clinical or personal notes
 */

/**
 * @typedef {Object} AppSettings
 * @property {number} sensitivity - Anomaly sensitivity multiplier (0.1 to 1.0)
 * @property {'continuous' | 'interval_5m' | 'interval_15m' | 'manual'} monitoringInterval - Monitoring rate mode
 * @property {boolean} darkMode - UI dark mode preference
 * @property {boolean} soundAlerts - Audible alert chime toggle
 * @property {boolean} hapticFeedback - Vibration / haptic feedback toggle
 */

/**
 * @typedef {Object} UserContextValue
 * @property {UserProfile} profile - User demographic and clinical profile
 * @property {AppSettings} settings - App customization and sensor parameters
 * @property {boolean} hasCompletedOnboarding - Whether user completed initial wizard
 * @property {boolean} isLoading - Initial storage hydration loading state
 * @property {(newProfile: Partial<UserProfile>) => Promise<boolean>} updateProfile - Update and persist user profile
 * @property {(newSettings: Partial<AppSettings>) => Promise<boolean>} updateSettings - Update and persist app settings
 * @property {(conditionName: string) => Promise<boolean>} toggleCondition - Toggle presence of a medical condition
 * @property {() => Promise<boolean>} completeOnboarding - Mark onboarding complete
 * @property {() => Promise<boolean>} resetOnboarding - Reset onboarding flag
 */

export const UserContext = createContext(/** @type {UserContextValue | null} */ (null));

/**
 * Default User Profile values
 * @type {UserProfile}
 */
const DEFAULT_PROFILE = {
  name: 'John Doe',
  age: 68,
  weightKg: 72,
  heightCm: 174,
  conditions: ["Parkinson's", 'Neuropathy'],
  doctorEmail: '',
  notes: '',
};

/**
 * Default App Settings
 * @type {AppSettings}
 */
const DEFAULT_SETTINGS = {
  sensitivity: 0.8,
  monitoringInterval: 'continuous',
  darkMode: false,
  soundAlerts: true,
  hapticFeedback: true,
};

export const UserProvider = ({ children }) => {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const profileRef = useRef(profile);
  const settingsRef = useRef(settings);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // ----------------------------------------------------
  // Load Persisted User State on Mount
  // ----------------------------------------------------
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const storedProfile = await StorageService.getItem(
          StorageKeys.USER_PROFILE,
          DEFAULT_PROFILE
        );
        const storedSettings = await StorageService.getItem(
          StorageKeys.APP_SETTINGS,
          DEFAULT_SETTINGS
        );
        const storedOnboarding = await StorageService.getItem(
          StorageKeys.ONBOARDING_STATUS,
          false
        );

        if (storedProfile) {
          setProfile((prev) => ({ ...prev, ...storedProfile }));
        }
        if (storedSettings) {
          setSettings((prev) => ({ ...prev, ...storedSettings }));
        }
        if (typeof storedOnboarding === 'boolean') {
          setHasCompletedOnboarding(storedOnboarding);
        }
      } catch (err) {
        console.warn('[UserContext] Failed to load user data from storage:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersistedData();
  }, []);

  // ----------------------------------------------------
  // Update Profile
  // ----------------------------------------------------
  const updateProfile = useCallback(async (newProfile) => {
    try {
      const updated = { ...profileRef.current, ...newProfile };
      profileRef.current = updated;
      setProfile(updated);
      await StorageService.setItem(StorageKeys.USER_PROFILE, updated);
      return true;
    } catch (err) {
      console.error('[UserContext] updateProfile failed:', err);
      return false;
    }
  }, []);

  // ----------------------------------------------------
  // Update Settings
  // ----------------------------------------------------
  const updateSettings = useCallback(async (newSettings) => {
    try {
      const updated = { ...settingsRef.current, ...newSettings };
      settingsRef.current = updated;
      setSettings(updated);
      await StorageService.setItem(StorageKeys.APP_SETTINGS, updated);
      return true;
    } catch (err) {
      console.error('[UserContext] updateSettings failed:', err);
      return false;
    }
  }, []);

  // ----------------------------------------------------
  // Toggle Condition in Profile
  // ----------------------------------------------------
  const toggleCondition = useCallback(async (conditionName) => {
    try {
      if (!conditionName) return false;
      const current = profileRef.current;
      const exists = current.conditions.includes(conditionName);
      const updatedProfile = { ...current, conditions: exists ? current.conditions.filter(c => c !== conditionName) : [...current.conditions, conditionName] };
      profileRef.current = updatedProfile;
      setProfile(updatedProfile);
      await StorageService.setItem(StorageKeys.USER_PROFILE, updatedProfile);

      return true;
    } catch (err) {
      console.error('[UserContext] toggleCondition failed:', err);
      return false;
    }
  }, []);

  // ----------------------------------------------------
  // Complete Onboarding
  // ----------------------------------------------------
  const completeOnboarding = useCallback(async () => {
    try {
      setHasCompletedOnboarding(true);
      await StorageService.setItem(StorageKeys.ONBOARDING_STATUS, true);
      return true;
    } catch (err) {
      console.error('[UserContext] completeOnboarding failed:', err);
      return false;
    }
  }, []);

  // ----------------------------------------------------
  // Reset Onboarding
  // ----------------------------------------------------
  const resetOnboarding = useCallback(async () => {
    try {
      setHasCompletedOnboarding(false);
      await StorageService.setItem(StorageKeys.ONBOARDING_STATUS, false);
      return true;
    } catch (err) {
      console.error('[UserContext] resetOnboarding failed:', err);
      return false;
    }
  }, []);

  const value = {
    profile,
    settings,
    hasCompletedOnboarding,
    isLoading,
    updateProfile,
    updateSettings,
    toggleCondition,
    completeOnboarding,
    resetOnboarding,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

/**
 * Custom Hook to consume UserContext
 * @returns {UserContextValue}
 */
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
