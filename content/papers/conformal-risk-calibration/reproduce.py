"""Marginal versus simultaneous conformal boxes, with explicit distribution shift."""
from pathlib import Path
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

OUT=Path(__file__).resolve().parent
SEED,REPS,NCAL,NTEST,N=20261007,60,200,1000,6
ALPHA=.1
SIGMA=np.array([.02,.025,.03,.035,.04,.05])
MU=np.full(N,.004)
LOSS_LIMIT=.04

def finite_quantile(scores):
    k=int(np.ceil((len(scores)+1)*(1-ALPHA)))
    if k>len(scores): return np.inf
    return np.sort(scores,axis=0)[k-1]

def main():
    rows=[]; first_scores=None
    for rep in range(REPS):
        rng=np.random.default_rng(SEED+rep)
        cal=rng.normal(size=(NCAL,N));q_m=finite_quantile(abs(cal));q_j=float(finite_quantile(abs(cal).max(axis=1)))
        shared=rng.normal(size=(NTEST,N))
        for scenario,scale,shift in [('Stationary',1.,0.),('Shifted',1.8,-.012)]:
            y=MU+shift+scale*shared*SIGMA
            scores=abs((y-MU)/SIGMA)
            if rep==0:
                if first_scores is None:first_scores=[]
                first_scores.extend({'scenario':scenario,'test_index':i,'max_score':float(v),'q_joint':q_j} for i,v in enumerate(scores.max(axis=1)))
            for method,q in [('Marginal boxes',q_m),('Joint max score',np.full(N,q_j))]:
                worst_loss=float(np.mean(q*SIGMA-MU))
                exposure=min(1.,LOSS_LIMIT/max(worst_loss,1e-12))
                losses=-exposure*y.mean(axis=1)
                rows.append({'rep':rep,'scenario':scenario,'method':method,
                             'average_asset_coverage':float((scores<=q).mean()),
                             'simultaneous_coverage':float(np.all(scores<=q,axis=1).mean()),
                             'loss_bound_coverage':float((losses<=LOSS_LIMIT).mean()),
                             'risky_exposure_pct':100*exposure,'mean_interval_q':float(q.mean()),
                             'mean_return_bps':1e4*float(exposure*y.mean()),
                             'loss_limit':LOSS_LIMIT})
    raw=pd.DataFrame(rows);raw.to_csv(OUT/'results.csv',index=False)
    scores=pd.DataFrame(first_scores);scores.to_csv(OUT/'scores.csv',index=False)
    records=[]
    for (scenario,method),group in raw.groupby(['scenario','method'],sort=False):
        r={'scenario':scenario,'method':method}
        for col in ['average_asset_coverage','simultaneous_coverage','loss_bound_coverage','risky_exposure_pct','mean_interval_q','mean_return_bps']:
            r[col]=float(group[col].mean());r[col+'_mcse']=float(group[col].std(ddof=1)/np.sqrt(REPS))
        records.append(r)
    with (OUT/'results.json').open('w',encoding='utf-8') as f: json.dump({'seed':SEED,'replications':REPS,'ncal':NCAL,'ntest':NTEST,'assets':N,'alpha':ALPHA,'summary':records},f,indent=2)
    plt.rcParams.update({'font.size':11,'axes.spines.top':False,'axes.spines.right':False})
    fig,ax=plt.subplots(figsize=(8,4.5))
    for scenario,group in scores.groupby('scenario',sort=False):
        values=np.sort(group.max_score);ax.plot(values,np.arange(1,len(values)+1)/len(values),label=scenario)
    ax.axvline(float(scores.q_joint.iloc[0]),color='#e9a44b',linestyle='--',label='Calibrated joint threshold')
    ax.axhline(.9,color='gray',linestyle=':',label='Nominal joint coverage 0.90')
    ax.set(xlabel='Maximum standardized residual',ylabel='Empirical distribution function',title='One synthetic calibration/test split');ax.legend()
    fig.tight_layout();fig.savefig(OUT/'fig1.png',dpi=180);plt.close(fig)
    fig,axes=plt.subplots(1,2,figsize=(9,4.5))
    labels=['Marginal','Joint'];xx=np.arange(2)
    for scenario,offset,color in [('Stationary',-.18,'#257b9b'),('Shifted',.18,'#e9a44b')]:
        rs=[next(r for r in records if r['scenario']==scenario and r['method']==m) for m in ['Marginal boxes','Joint max score']]
        axes[0].bar(xx+offset,[r['simultaneous_coverage'] for r in rs],width=.35,label=scenario,color=color,yerr=[r['simultaneous_coverage_mcse'] for r in rs],capsize=4)
    axes[0].axhline(.9,color='gray',linestyle=':');axes[0].set(xticks=xx,xticklabels=labels,ylabel='Simultaneous coverage',ylim=(0,1));axes[0].legend()
    stat=[r for r in records if r['scenario']=='Stationary']
    axes[1].bar(labels,[r['risky_exposure_pct'] for r in stat],yerr=[r['risky_exposure_pct_mcse'] for r in stat],capsize=4,color=['#738696','#257b9b'])
    axes[1].set(ylabel='Risky exposure (%)',ylim=(0,100))
    fig.tight_layout();fig.savefig(OUT/'fig2.png',dpi=180);plt.close(fig)
    print(json.dumps(records,indent=2))

if __name__=='__main__': main()
