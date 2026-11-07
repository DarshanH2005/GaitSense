/**
 * Formatting utilities for timestamps, numbers, percentages, durations, and dates.
 */

/**
 * Format seconds into human readable duration string (e.g., "1h 23m", "14m 30s", "42s")
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) {
    return '0s';
  }

  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const remainingSeconds = sec % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Format a number with thousands separators (e.g., 2847 -> "2,847")
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) {
    return '0';
  }
  return Number(n).toLocaleString('en-US');
}

/**
 * Helper to ensure a valid Date instance
 * @param {Date|number|string} dateOrTimestamp
 * @returns {Date}
 */
function toDate(dateOrTimestamp) {
  if (!dateOrTimestamp) return new Date();
  if (dateOrTimestamp instanceof Date) return dateOrTimestamp;
  if (typeof dateOrTimestamp === 'number') {
    // If timestamp is in seconds (10 digits), convert to ms
    const ms = dateOrTimestamp < 1e11 ? dateOrTimestamp * 1000 : dateOrTimestamp;
    return new Date(ms);
  }
  return new Date(dateOrTimestamp);
}

/**
 * Format date to friendly relative label or standard date string
 * Returns "Today", "Yesterday", or formatted like "Aug 18, 2026"
 * @param {Date|number|string} dateOrTimestamp
 * @returns {string}
 */
export function formatDate(dateOrTimestamp) {
  if (!dateOrTimestamp) return '';
  const d = toDate(dateOrTimestamp);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const todayKey = formatDateKey(now);
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  const targetKey = formatDateKey(d);

  if (targetKey === todayKey) {
    return 'Today';
  }
  if (targetKey === yesterdayKey) {
    return 'Yesterday';
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Format timestamp into relative day with time (e.g., "Today, 3:42 PM", "Yesterday, 10:15 AM", "Aug 18, 3:42 PM")
 * @param {Date|number|string} ts
 * @returns {string}
 */
export function formatTimestamp(ts) {
  if (!ts) return '';
  const d = toDate(ts);
  if (isNaN(d.getTime())) return '';

  const dayLabel = formatDate(d);
  
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  const timeStr = `${hours}:${minutesStr} ${ampm}`;

  return `${dayLabel}, ${timeStr}`;
}

/**
 * Format decimal value or fraction as percentage (e.g. 0.94 -> "94%", 94.2 with decimals=1 -> "94.2%")
 * @param {number} val - Value between 0-1 or 0-100
 * @param {number} decimals - Number of decimal places
 * @returns {string}
 */
export function formatPercentage(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(val)) {
    return '0%';
  }
  // Determine if value is normalized (0 to 1) or already 0 to 100
  const normalized = Math.abs(val) <= 1.0 && val !== 0 ? val * 100 : val;
  return `${Number(normalized).toFixed(decimals)}%`;
}

/**
 * Format model confidence score (e.g. 0.94 -> "94%", 0.856 -> "86%")
 * @param {number} conf - Confidence value (0.0 - 1.0 or 0 - 100)
 * @returns {string}
 */
export function formatConfidence(conf) {
  if (conf === null || conf === undefined || isNaN(conf)) {
    return '0%';
  }
  const pct = conf <= 1.0 ? conf * 100 : conf;
  return `${Math.round(pct)}%`;
}

/**
 * Format date to YYYY-MM-DD string key
 * @param {Date|number|string} [date]
 * @returns {string} e.g. "2026-08-18"
 */
export function formatDateKey(date) {
  const d = date ? toDate(date) : new Date();
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format raw ADC pressure value to PSI or percentage
 * @param {number} adcValue - 0 to 4095
 * @returns {string}
 */
export function formatPressure(adcValue) {
  if (adcValue === null || adcValue === undefined || isNaN(adcValue)) {
    return '0';
  }
  return `${Math.round(adcValue)}`;
}
