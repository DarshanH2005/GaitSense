/**
 * Gait Analysis and Biomechanical Utility Functions
 */

import { COLORS, GAIT_CLASSES, FSR_PRESSURE_RANGES } from './constants.js';
import { formatDateKey } from './formatters.js';

/**
 * Calculate step/stride symmetry ratio between Left and Right foot.
 * Uses formula: 1 - |stepsL - stepsR| / max(stepsL, stepsR, 1)
 * Returns value between 0.0 (completely asymmetric) and 1.0 (perfect symmetry).
 * @param {number} stepsL
 * @param {number} stepsR
 * @returns {number} 0.0 to 1.0
 */
export function calculateSymmetry(stepsL, stepsR) {
  const l = Math.max(0, Number(stepsL) || 0);
  const r = Math.max(0, Number(stepsR) || 0);
  
  if (l === 0 && r === 0) {
    return 1.0;
  }
  
  const maxSteps = Math.max(l, r, 1);
  const diff = Math.abs(l - r);
  const symmetry = 1 - (diff / maxSteps);
  return Math.max(0.0, Math.min(1.0, symmetry));
}

/**
 * Calculate pressure balance/symmetry between Left and Right insole FSR arrays.
 * @param {number[]} fsrL - Array of 4 FSR values for left foot
 * @param {number[]} fsrR - Array of 4 FSR values for right foot
 * @returns {number} Symmetry score between 0.0 and 1.0
 */
export function calculatePressureSymmetry(fsrL, fsrR) {
  if (!Array.isArray(fsrL) || !Array.isArray(fsrR) || fsrL.length === 0 || fsrR.length === 0) {
    return 1.0;
  }

  const avgL = fsrL.reduce((acc, v) => acc + (Number(v) || 0), 0) / fsrL.length;
  const avgR = fsrR.reduce((acc, v) => acc + (Number(v) || 0), 0) / fsrR.length;

  if (avgL === 0 && avgR === 0) {
    return 1.0;
  }

  const maxAvg = Math.max(avgL, avgR, 1);
  const diff = Math.abs(avgL - avgR);
  const symmetry = 1 - (diff / maxAvg);
  return Math.max(0.0, Math.min(1.0, symmetry));
}

/**
 * Get color representation based on 12-bit ADC FSR pressure value (0–4095).
 * 0–1000: Light Blue (#64D2FF)
 * 1000–2000: Green (#34C759)
 * 2000–3000: Yellow/Amber (#FF9500)
 * 3000–4095: Red (#FF3B30)
 * @param {number} fsrValue
 * @returns {string} Hex color
 */
export function getPressureColor(fsrValue) {
  const val = Number(fsrValue) || 0;
  
  for (const range of FSR_PRESSURE_RANGES) {
    if (val >= range.min && val <= range.max) {
      return range.color;
    }
  }
  
  if (val > 4095) return COLORS.PressureMax;
  return COLORS.PressureLow;
}

/**
 * Normalize raw FSR ADC value (0-4095) to clamped float 0.0 - 1.0
 * @param {number} fsrValue
 * @returns {number} 0.0 to 1.0
 */
export function getPressureNormalized(fsrValue) {
  const val = Number(fsrValue) || 0;
  return Math.max(0.0, Math.min(1.0, val / 4095.0));
}

/**
 * Determine overall status, title and UI color from ML classification and confidence score
 * @param {string} className - 'normal' | 'shuffle' | 'limp' | 'unsteady' | 'toe_walk'
 * @param {number} confidence - 0.0 to 1.0 or 0 to 100
 * @returns {{ status: 'normal'|'warning'|'danger', title: string, color: string, description: string }}
 */
export function getStatusFromClassification(className, confidence = 1.0) {
  const key = (className || '').toLowerCase().trim();
  const classInfo = GAIT_CLASSES[key] || GAIT_CLASSES.normal;

  let status = 'normal';
  if (key === 'shuffle' || key === 'toe_walk') {
    status = 'warning';
  } else if (key === 'limp' || key === 'unsteady') {
    status = 'danger';
  }

  return {
    status,
    title: classInfo.label,
    color: classInfo.color,
    description: classInfo.description,
    badgeColor: classInfo.badgeColor,
    icon: classInfo.icon,
  };
}

/**
 * Get comprehensive alert information metadata for a specific gait anomaly
 * @param {string} className - Anomaly classification key
 * @returns {{ title: string, description: string, badgeColor: string, icon: string, color: string, severity: string }}
 */
export function getAlertInfo(className) {
  const key = (className || '').toLowerCase().trim();
  const gait = GAIT_CLASSES[key];

  if (gait) {
    return {
      title: gait.label,
      description: gait.description,
      badgeColor: gait.badgeColor,
      icon: gait.icon,
      color: gait.color,
      severity: gait.severity,
    };
  }

  return {
    title: 'Gait Anomaly Detected',
    description: 'Abnormal foot pressure or stride pattern recorded.',
    badgeColor: 'rgba(255, 149, 0, 0.15)',
    icon: 'alert-circle-outline',
    color: COLORS.Warning,
    severity: 'warning',
  };
}

/**
 * Aggregate an array of raw stream events into a structured daily summary object
 * @param {Array<Object>} events - Array of stream/session packets { ts, side, class, conf, fsr, steps, alert }
 * @returns {Object} Daily aggregated metrics
 */
export function aggregateDailyEvents(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    const today = formatDateKey();
    return {
      date: today,
      totalSteps: 0,
      stepsLeft: 0,
      stepsRight: 0,
      symmetryScore: 1.0,
      classBreakdown: {
        normal: 0,
        shuffle: 0,
        limp: 0,
        unsteady: 0,
        toe_walk: 0,
      },
      averagePressure: [0, 0, 0, 0],
      alertCount: 0,
      dominantClass: 'normal',
      activeDurationMinutes: 0,
    };
  }

  let stepsLeft = 0;
  let stepsRight = 0;
  let alertCount = 0;
  const fsrTotals = [0, 0, 0, 0];
  let fsrCount = 0;
  const classBreakdown = {
    normal: 0,
    shuffle: 0,
    limp: 0,
    unsteady: 0,
    toe_walk: 0,
  };

  const timestamps = [];

  for (const ev of events) {
    if (!ev) continue;

    if (ev.ts) {
      timestamps.push(new Date(ev.ts).getTime());
    }

    if (ev.side === 'L' && typeof ev.steps === 'number') {
      stepsLeft = Math.max(stepsLeft, ev.steps);
    } else if (ev.side === 'R' && typeof ev.steps === 'number') {
      stepsRight = Math.max(stepsRight, ev.steps);
    }

    if (ev.class && classBreakdown[ev.class] !== undefined) {
      classBreakdown[ev.class] += 1;
    } else if (ev.class) {
      classBreakdown.normal += 1;
    }

    if (ev.alert || (ev.class && ev.class !== 'normal')) {
      alertCount += (ev.alert ? 1 : 0);
    }

    if (Array.isArray(ev.fsr) && ev.fsr.length === 4) {
      fsrTotals[0] += Number(ev.fsr[0]) || 0;
      fsrTotals[1] += Number(ev.fsr[1]) || 0;
      fsrTotals[2] += Number(ev.fsr[2]) || 0;
      fsrTotals[3] += Number(ev.fsr[3]) || 0;
      fsrCount++;
    }
  }

  const totalSteps = stepsLeft + stepsRight;
  const symmetryScore = calculateSymmetry(stepsLeft, stepsRight);

  const averagePressure = fsrCount > 0
    ? fsrTotals.map(sum => Math.round(sum / fsrCount))
    : [0, 0, 0, 0];

  // Find dominant class
  let dominantClass = 'normal';
  let maxCount = -1;
  for (const [cls, count] of Object.entries(classBreakdown)) {
    if (count > maxCount) {
      maxCount = count;
      dominantClass = cls;
    }
  }

  // Calculate duration if timestamps are present
  let activeDurationMinutes = 0;
  if (timestamps.length >= 2) {
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    activeDurationMinutes = Math.max(0, Math.round((maxTs - minTs) / (1000 * 60)));
  }

  const sampleDate = events[0]?.ts ? formatDateKey(events[0].ts) : formatDateKey();

  return {
    date: sampleDate,
    totalSteps,
    stepsLeft,
    stepsRight,
    symmetryScore,
    classBreakdown,
    averagePressure,
    alertCount,
    dominantClass,
    activeDurationMinutes,
  };
}

/**
 * Calculate Center of Pressure (COP) coordinate on a 2D normalized plane (-1 to 1)
 * Zone 0: Heel (bottom, y = -0.7, x = 0)
 * Zone 1: Midfoot (mid-lateral, y = -0.1, x = -0.2)
 * Zone 2: Forefoot Medial (top-inner, y = 0.6, x = -0.5 for L, +0.5 for R)
 * Zone 3: Forefoot Lateral (top-outer, y = 0.5, x = 0.5 for L, -0.5 for R)
 * @param {number[]} fsr - [heel, midfoot, mth1, mth4_5]
 * @param {'L'|'R'} side
 * @returns {{ x: number, y: number }} Normalized coordinates
 */
export function calculateCenterOfPressure(fsr = [0, 0, 0, 0], side = 'L') {
  const isLeft = side === 'L';
  const positions = [
    { x: 0.0, y: -0.7 },                          // Heel
    { x: isLeft ? -0.2 : 0.2, y: -0.1 },          // Midfoot
    { x: isLeft ? 0.4 : -0.4, y: 0.6 },           // Medial forefoot
    { x: isLeft ? -0.4 : 0.4, y: 0.5 },          // Lateral forefoot
  ];

  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (let i = 0; i < 4; i++) {
    const val = Number(fsr[i]) || 0;
    totalWeight += val;
    weightedX += val * positions[i].x;
    weightedY += val * positions[i].y;
  }

  if (totalWeight <= 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: weightedX / totalWeight,
    y: weightedY / totalWeight,
  };
}
