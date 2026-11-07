// Protocol v1: two 20-byte BLE notifications per 32-byte sample (works at MTU 23).
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decode64(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new Error('Invalid base64');
  const out = []; let bits = 0, count = 0;
  for (const c of value.replace(/=+$/, '')) {
    bits = (bits << 6) | ALPHABET.indexOf(c); count += 6;
    if (count >= 8) { count -= 8; out.push((bits >> count) & 255); }
  }
  return Uint8Array.from(out);
}
function encode64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    out += ALPHABET[(n >>> 18) & 63] + ALPHABET[(n >>> 12) & 63] +
      (i + 1 < bytes.length ? ALPHABET[(n >>> 6) & 63] : '=') + (i + 2 < bytes.length ? ALPHABET[n & 63] : '=');
  }
  return out;
}
function createDecoder(side) {
  let pending = null;
  return (base64, now = Date.now()) => {
    const b = decode64(base64);
    if (b.length !== 20 || b[0] !== 0xa1 || (b[1] & ~7)) throw new Error('Unsupported telemetry frame');
    const actualSide = b[1] & 2 ? 'R' : 'L';
    if (actualSide !== side) throw new Error('Insole side does not match selected side');
    const seq = b[2] | (b[3] << 8);
    if (!(b[1] & 1)) { pending = { seq, at: now, flags: b[1], data: b.slice(4) }; return null; }
    if (!pending || pending.seq !== seq || now - pending.at > 500 || (pending.flags ^ b[1]) !== 1) {
      pending = null; return null;
    }
    const payload = new Uint8Array(32); payload.set(pending.data); payload.set(b.slice(4), 16); pending = null;
    const v = new DataView(payload.buffer);
    const adc = [0, 1, 2, 3].map(i => v.getUint16(4 + i * 2, true));
    if (adc.some(x => x > 32767)) throw new Error('Invalid ADC reading');
    return { version: 1, side, seq, deviceMs: v.getUint32(0, true),
      adc, fsr: adc.map(x => Math.min(4095, Math.round(x * 0.125 / 3300 * 4095))),
      ax: v.getInt16(12, true) / 1000, ay: v.getInt16(14, true) / 1000, az: v.getInt16(16, true) / 1000,
      gx: v.getInt16(18, true) / 10, gy: v.getInt16(20, true) / 10, gz: v.getInt16(22, true) / 10,
      steps: v.getUint32(24, true), boot: v.getUint32(28, true), calibrated: Boolean(b[1] & 4),
      receivedAt: now, class: 'unknown', conf: 0, alert: false };
  };
}
// Minimum observed arrival offset reduces variable transport delay. Not hardware synchronization.
function createClock() {
  let boot, last, wraps = 0, offset = Infinity, lastSeq;
  return packet => {
    if (packet.boot !== boot) { boot = packet.boot; last = undefined; wraps = 0; offset = Infinity; lastSeq = undefined; }
    if (lastSeq !== undefined) {
      const delta = (packet.seq - lastSeq + 65536) % 65536;
      if (delta === 0 || delta > 32768) return null;
      packet.dropped = delta - 1;
    } else packet.dropped = 0;
    if (last !== undefined && last > 0xf0000000 && packet.deviceMs < 0x10000000) wraps++;
    last = packet.deviceMs; lastSeq = packet.seq;
    const elapsed = packet.deviceMs + wraps * 4294967296;
    offset = Math.min(offset, packet.receivedAt - elapsed);
    return { ...packet, ts: elapsed + offset };
  };
}
module.exports = { decode64, encode64, createDecoder, createClock };
