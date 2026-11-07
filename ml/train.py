"""Train/export the GaitSense phone decision-tree model from exported sessions.

Usage: python train.py --input recordings --output model.json --report evaluation.json
Only real (demo=false) labelled recordings are accepted. Splits are grouped by
participant so windows from one person never occur in both train and test.
"""
import argparse, json, pathlib, sys
import numpy as np
from sklearn.model_selection import GroupShuffleSplit
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report, confusion_matrix

LABELS = ['standing', 'normal', 'shuffle', 'limp', 'unsteady', 'toe_walk']
CHANNELS = ['p0', 'p1', 'p2', 'p3', 'ax', 'ay', 'az', 'gx', 'gy', 'gz']
FEATURES = [f'{channel}_{stat}' for channel in CHANNELS for stat in ('mean', 'std', 'min', 'max')]

def packet_values(packet):
    return [*(x / 4095 for x in packet['fsr']), *(packet[k] for k in CHANNELS[4:])]

def valid(window):
    return (len(window) >= 80 and window[-1]['ts'] - window[0]['ts'] >= 1800 and
            all(p.get('calibrated') for p in window) and
            all(p['boot'] == q['boot'] and p['ts'] > q['ts'] and p['ts'] - q['ts'] <= 100 for p, q in zip(window[1:], window)))

def make_features(window):
    values = np.asarray([packet_values(p) for p in window], dtype=float)
    if not np.isfinite(values).all(): raise ValueError('non-finite sensor value')
    return np.stack((values.mean(0), values.std(0), values.min(0), values.max(0)), axis=1).ravel().tolist()

def windows(session):
    packets = session.get('packets', [])
    for side in ('L', 'R'):
        stream = sorted((p for p in packets if p.get('side') == side), key=lambda p: p.get('ts', -1))
        last_emitted = -10**12
        for end in range(len(stream)):
            start = end
            while start and stream[end]['ts'] - stream[start - 1]['ts'] <= 2000: start -= 1
            window = stream[start:end + 1]
            # one inference window per second, matching the phone runtime
            if stream[end]['ts'] - last_emitted < 1000: continue
            if valid(window):
                last_emitted = stream[end]['ts']
                yield make_features(window)

def read_sessions(path):
    for file in pathlib.Path(path).rglob('*.json'):
        try:
            with file.open(encoding='utf-8') as handle: session = json.load(handle)
            if session.get('demo'): continue
            if session.get('label') not in LABELS or not session.get('participant'): continue
            yield file, session
        except (OSError, json.JSONDecodeError):
            print(f'Skipping unreadable file: {file}', file=sys.stderr)

def tree_nodes(tree, classes):
    nodes = []
    def visit(index):
        out_index = len(nodes); nodes.append(None)
        if tree.children_left[index] == tree.children_right[index]:
            counts = tree.value[index][0]; probs = (counts / counts.sum()).tolist()
            nodes[out_index] = {'probs': probs}
        else:
            left, right = visit(tree.children_left[index]), visit(tree.children_right[index])
            nodes[out_index] = {'feature': int(tree.feature[index]), 'threshold': float(tree.threshold[index]), 'left': left, 'right': right}
        return out_index
    visit(0); return nodes

def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--input', required=True); parser.add_argument('--output', required=True); parser.add_argument('--report', required=True); parser.add_argument('--seed', type=int, default=42); parser.add_argument('--max-depth', type=int, default=6); parser.add_argument('--min-leaf', type=int, default=10)
    args = parser.parse_args(); X=[]; y=[]; groups=[]; sessions=0
    for _, session in read_sessions(args.input):
        session_windows = list(windows(session)); sessions += 1
        X.extend(session_windows); y.extend([session['label']] * len(session_windows)); groups.extend([session['participant']] * len(session_windows))
    if len(set(groups)) < 2: raise SystemExit('Need valid recordings from at least two participants; no demo data is accepted.')
    if len(set(y)) < 2: raise SystemExit('Need at least two observed labels to train a classifier.')
    X=np.asarray(X); y=np.asarray(y); groups=np.asarray(groups)
    train, test = next(GroupShuffleSplit(n_splits=1, test_size=.25, random_state=args.seed).split(X, y, groups))
    classifier=DecisionTreeClassifier(max_depth=args.max_depth, min_samples_leaf=args.min_leaf, random_state=args.seed, class_weight='balanced')
    classifier.fit(X[train], y[train]); predicted=classifier.predict(X[test]); classes=classifier.classes_.tolist()
    model={'version':1, 'kind':'decision_tree', 'name':f'gaitsense-tree-{sessions}-sessions', 'windowMs':2000, 'features':FEATURES, 'classes':classes, 'nodes':tree_nodes(classifier.tree_, classes)}
    pathlib.Path(args.output).write_text(json.dumps(model, indent=2), encoding='utf-8')
    report={'participants': sorted(set(groups.tolist())), 'sessions': sessions, 'windows': int(len(y)), 'classes': classes, 'trainParticipants': sorted(set(groups[train].tolist())), 'testParticipants': sorted(set(groups[test].tolist())), 'confusionMatrix': confusion_matrix(y[test], predicted, labels=classes).tolist(), 'classificationReport': classification_report(y[test], predicted, labels=classes, output_dict=True, zero_division=0), 'parameters':vars(args)}
    pathlib.Path(args.report).write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(f'Wrote {args.output} and {args.report}. Test participants are held out from training.')
if __name__ == '__main__': main()
