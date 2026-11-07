/**
 * MockDataService
 * Simulates ESP32 BLE gait telemetry packets, walking cycle biomechanics,
 * historical dataset generation, and realistic streaming scenarios.
 */

import { formatDateKey } from '../utils/formatters.js';

// Internal step counter & cycle tracker state for streaming simulation
let simulatedStepsL = 1420;
let simulatedStepsR = 1415;
let cyclePhase = 0; // 0 to 1 representing position in 1.0s gait stride cycle

/**
 * Generate a single simulated telemetry packet from an ESP32 smart insole.
 * @param {'L'|'R'} side - 'L' (Left) or 'R' (Right)
 * @param {Object} options - Custom overrides (mode, class, stepDelta, etc.)
 * @returns {Object} BLE Packet schema: { ts, side, class, conf, fsr: [4 numbers], ax, ay, az, steps, alert }
 */
export function generateMockPacket(side = 'L', options = {}) {
  const mode = options.mode || 'normal'; // 'normal' | 'shuffle' | 'limp' | 'unsteady' | 'toe_walk' | 'resting'
  const now = new Date();
  
  if (options.advanceCycle !== false) {
    cyclePhase = (cyclePhase + 0.15) % 1.0;
  }

  // Phase calculation (0.0 - 0.6 is stance, 0.6 - 1.0 is swing)
  // Shift right foot phase by 0.5 for alternating natural gait
  const effectivePhase = side === 'R' ? (cyclePhase + 0.5) % 1.0 : cyclePhase;

  let fsr = [0, 0, 0, 0];
  let ax = 0.05 + (Math.random() * 0.1 - 0.05);
  let ay = 0.02 + (Math.random() * 0.1 - 0.05);
  let az = 0.98 + (Math.random() * 0.05);
  let predictedClass = 'normal';
  let conf = 0.94 + (Math.random() * 0.05);
  let alert = false;

  if (mode === 'resting') {
    fsr = [
      Math.floor(50 + Math.random() * 40),
      Math.floor(30 + Math.random() * 30),
      Math.floor(20 + Math.random() * 20),
      Math.floor(20 + Math.random() * 20),
    ];
    predictedClass = 'normal';
    conf = 0.99;
  } else if (mode === 'shuffle') {
    // Shuffling: Low heel strike, flat dragging foot, reduced vertical acceleration
    predictedClass = 'shuffle';
    conf = 0.88 + Math.random() * 0.09;
    alert = Math.random() < 0.25;

    if (effectivePhase < 0.7) {
      // Dragging contact
      fsr = [
        Math.floor(400 + Math.random() * 300),
        Math.floor(600 + Math.random() * 400),
        Math.floor(700 + Math.random() * 500),
        Math.floor(650 + Math.random() * 450),
      ];
      az = 0.85 + Math.random() * 0.15;
      ay = 0.35 + Math.random() * 0.2; // Forward dragging drag
    } else {
      fsr = [80, 50, 60, 60];
    }
  } else if (mode === 'limp') {
    // Limping: Left leg has diminished stance and weak heel strike
    predictedClass = 'limp';
    conf = 0.91 + Math.random() * 0.07;
    alert = Math.random() < 0.2;

    if (side === 'L') {
      // Avoidance on left leg
      if (effectivePhase < 0.35) {
        fsr = [
          Math.floor(700 + Math.random() * 300),
          Math.floor(500 + Math.random() * 300),
          Math.floor(900 + Math.random() * 400),
          Math.floor(800 + Math.random() * 300),
        ];
        az = 1.05 + Math.random() * 0.2;
      } else {
        fsr = [50, 40, 40, 40];
      }
    } else {
      // Heavy compensatory stance on right leg
      if (effectivePhase < 0.65) {
        fsr = [
          Math.floor(2800 + Math.random() * 800),
          Math.floor(1900 + Math.random() * 600),
          Math.floor(3200 + Math.random() * 700),
          Math.floor(2900 + Math.random() * 600),
        ];
        az = 1.35 + Math.random() * 0.3;
      } else {
        fsr = [60, 50, 50, 50];
      }
    }
  } else if (mode === 'toe_walk') {
    // Toe walking: Calcaneus (heel) has virtually no load, forefoot absorbs high peak load
    predictedClass = 'toe_walk';
    conf = 0.93 + Math.random() * 0.06;
    alert = Math.random() < 0.15;

    if (effectivePhase < 0.6) {
      fsr = [
        Math.floor(100 + Math.random() * 80), // Near zero heel contact
        Math.floor(400 + Math.random() * 200),
        Math.floor(3100 + Math.random() * 800), // High MTH1
        Math.floor(2800 + Math.random() * 700), // High MTH4-5
      ];
      az = 1.15 + Math.random() * 0.2;
    } else {
      fsr = [30, 40, 60, 50];
    }
  } else if (mode === 'unsteady') {
    // Unsteady: Erratic FSR distribution and lateral sway
    predictedClass = 'unsteady';
    conf = 0.86 + Math.random() * 0.11;
    alert = true;

    ax = (Math.random() - 0.5) * 0.9; // Large lateral sway
    ay = (Math.random() - 0.5) * 0.8;
    az = 0.7 + Math.random() * 0.8;

    fsr = [
      Math.floor(600 + Math.random() * 2500),
      Math.floor(300 + Math.random() * 2000),
      Math.floor(500 + Math.random() * 2800),
      Math.floor(400 + Math.random() * 2600),
    ];
  } else {
    // Normal Gait Cycle: Heel Strike -> Midstance -> Forefoot Push-off -> Swing
    predictedClass = 'normal';
    conf = 0.95 + Math.random() * 0.04;
    alert = false;

    if (effectivePhase < 0.2) {
      // 1. Heel Strike
      fsr = [
        Math.floor(2200 + Math.random() * 600), // High Heel
        Math.floor(300 + Math.random() * 200),
        Math.floor(100 + Math.random() * 100),
        Math.floor(100 + Math.random() * 100),
      ];
      az = 1.25 + Math.random() * 0.15;
    } else if (effectivePhase < 0.4) {
      // 2. Midstance / Full foot contact
      fsr = [
        Math.floor(1400 + Math.random() * 400),
        Math.floor(1600 + Math.random() * 400), // Midfoot peak
        Math.floor(900 + Math.random() * 300),
        Math.floor(800 + Math.random() * 300),
      ];
      az = 1.02 + Math.random() * 0.08;
    } else if (effectivePhase < 0.6) {
      // 3. Forefoot Push-off (Terminal Stance / Pre-swing)
      fsr = [
        Math.floor(200 + Math.random() * 150),
        Math.floor(600 + Math.random() * 250),
        Math.floor(2600 + Math.random() * 700), // Peak inner forefoot
        Math.floor(2200 + Math.random() * 600), // Peak outer forefoot
      ];
      az = 1.35 + Math.random() * 0.2;
      ay = 0.45 + Math.random() * 0.15;
    } else {
      // 4. Swing Phase (Insole in air)
      fsr = [
        Math.floor(40 + Math.random() * 40),
        Math.floor(30 + Math.random() * 30),
        Math.floor(30 + Math.random() * 30),
        Math.floor(30 + Math.random() * 30),
      ];
      az = 0.85 + Math.random() * 0.1;
    }
  }

  // Increment steps when completing stride
  if (options.advanceSteps !== false && effectivePhase > 0.55 && effectivePhase < 0.65) {
    if (side === 'L') simulatedStepsL++;
    else simulatedStepsR++;
  }

  const steps = side === 'L' ? simulatedStepsL : simulatedStepsR;

  return {
    ts: now.toISOString(),
    side,
    class: options.class || predictedClass,
    conf: Number((options.conf !== undefined ? options.conf : conf).toFixed(2)),
    fsr: options.fsr || fsr,
    ax: Number(ax.toFixed(3)),
    ay: Number(ay.toFixed(3)),
    az: Number(az.toFixed(3)),
    steps,
    alert: options.alert !== undefined ? options.alert : alert,
  };
}

/**
 * Generate 3-5 initial realistic alerts for clinical preview and dashboard
 * @returns {Array<Object>}
 */
export function createInitialAlerts() {
  const now = Date.now();
  return [
    {
      id: 'alert_001',
      ts: new Date(now - 1000 * 60 * 18).toISOString(), // 18 mins ago
      title: 'Shuffling Gait Detected',
      class: 'shuffle',
      severity: 'warning',
      description: 'Consecutive shuffling strides observed for 45 seconds during morning stroll.',
      confidence: 0.92,
      read: false,
    },
    {
      id: 'alert_002',
      ts: new Date(now - 1000 * 60 * 60 * 3.5).toISOString(), // 3.5 hours ago
      title: 'Left Leg Asymmetry (Limping)',
      class: 'limp',
      severity: 'danger',
      description: 'Significant pressure drop on Left Heel (-38% vs Right). Possible fatigue or joint strain.',
      confidence: 0.95,
      read: false,
    },
    {
      id: 'alert_003',
      ts: new Date(now - 1000 * 60 * 60 * 26).toISOString(), // Yesterday
      title: 'Unsteady Balance Episode',
      class: 'unsteady',
      severity: 'danger',
      description: 'Lateral sway acceleration exceeded safe 0.6g threshold. Patient stabilized quickly.',
      confidence: 0.89,
      read: true,
    },
    {
      id: 'alert_004',
      ts: new Date(now - 1000 * 60 * 60 * 52).toISOString(), // 2 days ago
      title: 'Toe Walking Pattern',
      class: 'toe_walk',
      severity: 'warning',
      description: 'Prolonged forefoot weight bearing with absent heel strike detected over 120 steps.',
      confidence: 0.94,
      read: true,
    },
  ];
}

/**
 * Generates an array of 7-day realistic gait history records
 * @param {number} days - Number of days to generate (default 7)
 * @returns {Array<Object>} Array of daily summary objects
 */
export function createMockHistory(days = 7) {
  const history = [];
  const baseSteps = [5420, 6180, 4920, 6890, 5830, 4310, 6420];
  const symmetries = [0.93, 0.91, 0.84, 0.94, 0.88, 0.79, 0.92];
  const dominantClasses = ['normal', 'normal', 'shuffle', 'normal', 'limp', 'shuffle', 'normal'];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = formatDateKey(d);

    const idx = (days - 1 - i) % baseSteps.length;
    const total = baseSteps[idx];
    const sym = symmetries[idx];
    const domClass = dominantClasses[idx];

    // Calculate left/right steps matching symmetry
    const half = Math.floor(total / 2);
    const diff = Math.floor(half * (1 - sym));
    const stepsLeft = half - diff;
    const stepsRight = half + diff;

    // Class distribution
    const normalCount = Math.floor(total * (domClass === 'normal' ? 0.85 : 0.45));
    const shuffleCount = Math.floor(total * (domClass === 'shuffle' ? 0.35 : 0.08));
    const limpCount = Math.floor(total * (domClass === 'limp' ? 0.30 : 0.04));
    const unsteadyCount = Math.floor(total * 0.02);
    const toeWalkCount = total - normalCount - shuffleCount - limpCount - unsteadyCount;

    history.push({
      date: dateKey,
      totalSteps: total,
      stepsLeft,
      stepsRight,
      symmetryScore: sym,
      dominantClass: domClass,
      classBreakdown: {
        normal: Math.max(0, normalCount),
        shuffle: Math.max(0, shuffleCount),
        limp: Math.max(0, limpCount),
        unsteady: Math.max(0, unsteadyCount),
        toe_walk: Math.max(0, toeWalkCount),
      },
      averagePressure: [
        Math.floor(1800 + Math.random() * 400), // Heel
        Math.floor(1200 + Math.random() * 300), // Midfoot
        Math.floor(2100 + Math.random() * 500), // MTH1
        Math.floor(1950 + Math.random() * 450), // MTH4-5
      ],
      alertCount: domClass === 'normal' ? 0 : domClass === 'shuffle' ? 2 : 3,
      activeDurationMinutes: Math.floor(total / 100), // ~100 steps/min
    });
  }

  return history;
}

/**
 * MockStreamManager
 * Stream simulation manager that broadcasts packets to subscribers at regular intervals.
 */
class MockStreamManagerClass {
  constructor() {
    this.intervalId = null;
    this.intervalMs = 500;
    this.currentMode = 'normal'; // 'normal' | 'shuffle' | 'limp' | 'unsteady' | 'toe_walk'
    this.subscribers = new Set();
    this.toggleFoot = 'L';
  }

  /**
   * Set simulation scenario mode
   * @param {'normal'|'shuffle'|'limp'|'unsteady'|'toe_walk'|'resting'} mode
   */
  setMode(mode) {
    this.currentMode = mode;
  }

  /**
   * Get current simulation scenario mode
   */
  getMode() {
    return this.currentMode;
  }

  /**
   * Start emitting mock data packets
   * @param {Function} [callback] - Packet handler callback (side, packet)
   * @param {number} [interval=500] - Emission interval in milliseconds
   */
  start(callback, interval = 500) {
    if (callback && typeof callback === 'function') {
      this.subscribers.add(callback);
    }
    this.intervalMs = interval;

    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      // Emit alternating Left and Right insole packets
      const packetL = generateMockPacket('L', { mode: this.currentMode, advanceCycle: true, advanceSteps: true });
      const packetR = generateMockPacket('R', { mode: this.currentMode, advanceCycle: false, advanceSteps: true });

      for (const sub of this.subscribers) {
        try {
          sub(packetL, packetR);
        } catch (err) {
          console.warn('[MockStreamManager] Subscriber error:', err);
        }
      }
    }, this.intervalMs);
  }

  /**
   * Stop emitting mock data
   */
  stop(callback) {
    if (callback) {
      this.subscribers.delete(callback);
    }
    if (this.subscribers.size === 0 || !callback) {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      if (!callback) {
        this.subscribers.clear();
      }
    }
  }

  /**
   * Check if simulation is currently streaming
   */
  isRunning() {
    return this.intervalId !== null;
  }
}

export const MockStreamManager = new MockStreamManagerClass();
