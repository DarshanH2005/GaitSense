const dateKey = (time = Date.now()) => { const d = new Date(time); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const emptyStats = () => ({ totalSteps: 0, stepsLeft: 0, stepsRight: 0, symmetryScore: null, dominantClass: 'unknown', normalPct: 0, shufflePct: 0, limpPct: 0, unsteadyPct: 0, toeWalkPct: 0, standingPct: 0, alertCount: 0, counts: {} });
function stepDelta(previous, packet) {
  if (!previous || previous.boot !== packet.boot || packet.steps < previous.steps) return 0;
  return packet.steps - previous.steps;
}
function distribution(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const pct = c => total ? Math.round(100 * (counts[c] || 0) / total) : 0;
  return { dominantClass: total ? Object.keys(counts).reduce((a, b) => counts[a] >= counts[b] ? a : b) : 'unknown',
    normalPct: pct('normal'), shufflePct: pct('shuffle'), limpPct: pct('limp'), unsteadyPct: pct('unsteady'), toeWalkPct: pct('toe_walk'), standingPct: pct('standing') };
}
function symmetry(left, right) { const total = left + right; return total ? Math.round(100 * (1 - Math.abs(left - right) / total)) : null; }
module.exports = { dateKey, emptyStats, stepDelta, distribution, symmetry };
