const CHANNELS = ['p0', 'p1', 'p2', 'p3', 'ax', 'ay', 'az', 'gx', 'gy', 'gz'];
const FEATURE_NAMES = CHANNELS.flatMap(c => ['mean', 'std', 'min', 'max'].map(s => `${c}_${s}`));
const LABELS = ['standing', 'normal', 'shuffle', 'limp', 'unsteady', 'toe_walk'];
function features(packets) {
  if (!packets.length) throw new Error('Empty window');
  return CHANNELS.flatMap((c, i) => {
    const a = packets.map(p => i < 4 ? p.fsr[i] / 4095 : p[c]);
    if (a.some(x => !Number.isFinite(x))) throw new Error('Non-finite feature');
    const mean = a.reduce((x, y) => x + y, 0) / a.length;
    return [mean, Math.sqrt(a.reduce((s, x) => s + (x - mean) ** 2, 0) / a.length), Math.min(...a), Math.max(...a)];
  });
}
function validateModel(m) {
  if (!m || m.version !== 1 || m.kind !== 'decision_tree' || m.windowMs !== 2000 ||
      JSON.stringify(m.features) !== JSON.stringify(FEATURE_NAMES) || !Array.isArray(m.classes) ||
      m.classes.length < 2 || m.classes.some(c => !LABELS.includes(c)) || new Set(m.classes).size !== m.classes.length ||
      !Array.isArray(m.nodes) || !m.nodes.length || m.nodes.length > 4096) throw new Error('Unsupported model schema');
  const seen = new Set();
  function walk(i, depth) {
    if (!Number.isInteger(i) || i < 0 || i >= m.nodes.length || seen.has(i) || depth > 32) throw new Error('Invalid model tree');
    seen.add(i); const n = m.nodes[i];
    if (n.probs) {
      if (n.probs.length !== m.classes.length || n.probs.some(p => !Number.isFinite(p) || p < 0 || p > 1) ||
          Math.abs(n.probs.reduce((a, b) => a + b, 0) - 1) > 0.001) throw new Error('Invalid probabilities');
    } else {
      if (!Number.isInteger(n.feature) || n.feature < 0 || n.feature >= FEATURE_NAMES.length || !Number.isFinite(n.threshold)) throw new Error('Invalid split');
      walk(n.left, depth + 1); walk(n.right, depth + 1);
    }
  }
  walk(0, 0); return m;
}
function predict(m, values) {
  let node = m.nodes[0];
  while (!node.probs) node = m.nodes[values[node.feature] <= node.threshold ? node.left : node.right];
  const conf = Math.max(...node.probs); return { class: m.classes[node.probs.indexOf(conf)], conf };
}
function validWindow(packets) {
  return packets.length >= 80 && packets.at(-1).ts - packets[0].ts >= 1800 &&
    packets.every((p, i) => p.calibrated && (!i || (p.boot === packets[i - 1].boot && p.ts > packets[i - 1].ts && p.ts - packets[i - 1].ts <= 100)));
}
module.exports = { FEATURE_NAMES, LABELS, features, validateModel, predict, validWindow };
