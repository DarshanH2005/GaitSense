"""Create a *research bootstrap* from the public Insole-GAITRite dataset.

This is intentionally IMU-only: public 32-pressure sensor positions and our four
FSR positions are not equivalent. Pressure features are zeroed so the exported
tree can only split on IMU features. It trains STAND versus walking (SP/NP/FP).
Never present its output as a clinical, personal, or disorder classifier.
"""
import argparse, csv, json, pathlib, re
import numpy as np
from sklearn.model_selection import GroupShuffleSplit
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report, confusion_matrix
from train import FEATURES, tree_nodes

def column(headers, terms):
    for h in headers:
        low = h.lower().replace('_', '')
        if all(term in low for term in terms): return h
    return None
def read_clip(file, label):
    with open(file, encoding='utf-8-sig', newline='') as f:
        rows=list(csv.DictReader(f)); headers=rows[0].keys() if rows else []
    axes=[]
    for group in (('acc','x'),('acc','y'),('acc','z'),('gyro','x'),('gyro','y'),('gyro','z')):
        name=column(headers, group)
        if not name: raise ValueError(f'{file}: cannot find {group} column')
        axes.append(name)
    packets=[]
    for i,row in enumerate(rows):
        try: values=[float(row[x]) for x in axes]
        except (ValueError, TypeError): continue
        packets.append([0.,0.,0.,0.,*values])
    out=[]
    for start in range(0, max(0, len(packets)-128), 64):
        w=np.asarray(packets[start:start+128]);
        if len(w)<80: continue
        out.append(np.stack((w.mean(0),w.std(0),w.min(0),w.max(0)), axis=1).ravel().tolist())
    return out, label
def main():
    p=argparse.ArgumentParser(); p.add_argument('--input',required=True); p.add_argument('--output',required=True); p.add_argument('--report',required=True); a=p.parse_args()
    X=[];y=[];groups=[]
    for file in pathlib.Path(a.input).rglob('*.csv'):
        parts={x.upper() for x in file.parts}; label='standing' if 'STAND' in parts else ('normal' if parts & {'SP','NP','FP'} else None)
        if not label or file.name.lower() not in ('l.csv','r.csv'): continue
        participant=next((x for x in file.parts if re.fullmatch(r'P\d+',x,re.I)),None)
        if not participant: continue
        try: feats,_=read_clip(file,label)
        except ValueError as e: print('skip',e); continue
        X.extend(feats);y.extend([label]*len(feats));groups.extend([participant]*len(feats))
    if len(set(groups))<2 or len(set(y))<2: raise SystemExit('No usable STAND/walking clips found; inspect CSV headers and extraction path.')
    X=np.asarray(X);y=np.asarray(y);groups=np.asarray(groups); tr,te=next(GroupShuffleSplit(n_splits=1,test_size=.25,random_state=42).split(X,y,groups))
    clf=DecisionTreeClassifier(max_depth=5,min_samples_leaf=20,class_weight='balanced',random_state=42).fit(X[tr],y[tr])
    model={'version':1,'kind':'decision_tree','name':'PUBLIC RESEARCH BASELINE — IMU ONLY','windowMs':2000,'features':FEATURES,'classes':clf.classes_.tolist(),'nodes':tree_nodes(clf.tree_,clf.classes_.tolist()),'provenance':'Zenodo 10.5281/zenodo.19662017; public insole geometry differs; not clinical or personal validation.'}
    pathlib.Path(a.output).write_text(json.dumps(model,indent=2),encoding='utf8')
    predicted=clf.predict(X[te])
    pathlib.Path(a.report).write_text(json.dumps({'participants':sorted(set(groups.tolist())),'windows':len(y),'trainParticipants':sorted(set(groups[tr].tolist())),'testParticipants':sorted(set(groups[te].tolist())),'classes':clf.classes_.tolist(),'confusionMatrix':confusion_matrix(y[te],predicted,labels=clf.classes_).tolist(),'classificationReport':classification_report(y[te],predicted,labels=clf.classes_,output_dict=True,zero_division=0),'scope':'standing versus walking; IMU-only bootstrap; pressure features intentionally zero'},indent=2),encoding='utf8')
if __name__=='__main__': main()
