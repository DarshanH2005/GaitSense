/**
 * @file index.js
 * @description Central export index for GaitSense React Context state management layer.
 * Exposes Providers, Context objects, Custom Hooks, and a composite AppProviders wrapper.
 */

import React from 'react';
import { BLEProvider, useBLE, default as BLEContext } from './BLEContext';
import { GaitProvider, useGait, default as GaitContext } from './GaitContext';
import { UserProvider, useUser, default as UserContext } from './UserContext';

/**
 * Composite Provider that wraps the entire app with all state layers in the correct dependency hierarchy:
 * 1. UserProvider (demographics & app settings)
 * 2. BLEProvider (hardware connections & mock stream)
 * 3. GaitProvider (metric computations, alert engine & storage sync)
 */
export const AppProviders = ({ children }) => {
  return (
    <UserProvider>
      <BLEProvider>
        <GaitProvider>{children}</GaitProvider>
      </BLEProvider>
    </UserProvider>
  );
};

export {
  // BLE Module
  BLEContext,
  BLEProvider,
  useBLE,
  // Gait Data & Analytics Module
  GaitContext,
  GaitProvider,
  useGait,
  // User Demographics & Settings Module
  UserContext,
  UserProvider,
  useUser,
};

export default AppProviders;
