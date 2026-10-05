"""Synthetic heavy-tail and measurement-contamination diagnostic."""
from pathlib import Path
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.optimize import minimize

OUT=Path(__file__).resolve().parent
SEED, REPS, N, M, P, GAMMA = 202610053, 120, 180, 4000, 6, .4
rng=np.random.default_rng(SEED)
mu=np.array([.03,.05,.06,.075,.09,.10]); vol=np.linspace(.7,1.2,P)
cov=np.outer(vol,vol)*.25+np.diag(vol**2*.75); chol=np.linalg.cholesky(cov)

def draw(n):
    return mu+(rng.normal(size=(n,P))@chol.T)/np.sqrt(rng.chisquare(3,size=n)[:,None]/3)*np.sqrt(1/3)

def shrink(s): return .8*s+.2*np.eye(P)*np.trace(s)/P

def solve(mean,s):
    fit=minimize(lambda w:.5*GAMMA*(w@s@w)-mean@w,np.ones(P)/P,jac=lambda w:GAMMA*s@w-mean,method='SLSQP',bounds=[(0,.6)]*P,constraints=[{'type':'eq','fun':lambda w:w.sum()-1,'jac':lambda w:np.ones(P)}],options={'ftol':1e-10,'maxiter':200})
    assert fit.success,fit.message
    return fit.x

def cvar(loss):
    t=np.quantile(loss,.95); return float(t+np.maximum(loss-t,0).mean()/.05)

oracle=solve(mu,cov); oracle_utility=float(mu@oracle-.5*GAMMA*(oracle@cov@oracle))
rows=[]; errors=[]
for rep in range(REPS):
    base=draw(N); test=draw(M)
    for fraction in [0.,.03]:
        x=base.copy()
        k=round(N*fraction)
        if k: x[rng.choice(N,k,replace=False),0]+=12.
        sample_mean=x.mean(axis=0); sample_cov=shrink(np.cov(x,rowvar=False))
        blocks=np.array_split(rng.permutation(N),9)
        mom_mean=np.median(np.stack([x[idx].mean(axis=0) for idx in blocks]),axis=0)
        median=np.median(x,axis=0); scale=np.maximum(1.4826*np.median(np.abs(x-median),axis=0),1e-6)
        clipped=np.clip(x,median-2.5*scale,median+2.5*scale)
        huber_mean=clipped.mean(axis=0); clipped_cov=shrink(np.cov(clipped,rowvar=False))
        candidates={'Sample':(sample_mean,sample_cov),'MOM mean':(mom_mean,sample_cov),'Winsorized':(huber_mean,clipped_cov),'Oracle':(mu,cov)}
        for method,(mean,s) in candidates.items():
            w=solve(mean,s); utility=float(mu@w-.5*GAMMA*(w@cov@w))
            error=float(np.linalg.norm(mean-mu))
            rows.append(dict(rep=rep,contamination=fraction,method=method,mean_l2_error=error,utility=utility,oracle_regret=oracle_utility-utility,true_vol=float(np.sqrt(w@cov@w)),test_cvar=cvar(-test@w),weight_asset1=float(w[0])))
            errors.append(dict(rep=rep,contamination=fraction,method=method,mean_l2_error=error))
df=pd.DataFrame(rows); df.to_csv(OUT/'replicates.csv',index=False)
summary=[]
for (fraction,method),g in df.groupby(['contamination','method'],sort=False):
    d={'contamination':float(fraction),'method':method,'n_replicates':len(g)}
    for key in ['mean_l2_error','utility','oracle_regret','true_vol','test_cvar','weight_asset1']:
        d[key]=float(g[key].mean()); d[key+'_se']=float(g[key].std(ddof=1)/np.sqrt(len(g)))
    summary.append(d)
(OUT/'results.json').write_text(json.dumps(dict(seed=SEED,reps=REPS,n_train=N,n_test=M,assets=P,gamma=GAMMA,blocks=9,winsor_mad_multiplier=2.5,oracle_utility=oracle_utility,units='daily percentage points; variance in squared percentage points',summary=summary),ensure_ascii=False,indent=2),encoding='utf-8')
plt.rcParams.update({'font.size':11,'axes.spines.top':False,'axes.spines.right':False})
fig,ax=plt.subplots(figsize=(8,4.5)); methods=['Sample','MOM mean','Winsorized']; positions=np.arange(len(methods))
for j,fraction in enumerate([0.,.03]):
    data=[df[(df.method==m)&(df.contamination==fraction)].mean_l2_error.to_numpy() for m in methods]
    ax.boxplot(data,positions=positions+(j-.5)*.32,widths=.26,showfliers=False,patch_artist=True,boxprops={'facecolor':['#A2C8E5','#F2B28F'][j]})
ax.plot([],[],color='#A2C8E5',lw=8,label='No contamination'); ax.plot([],[],color='#F2B28F',lw=8,label='Target 3%: 5 of 180 recording errors'); ax.set(xticks=positions,xticklabels=methods,ylabel='Mean estimation L2 error',title='Synthetic t(3) data: 120 Monte Carlo repetitions'); ax.legend(); fig.tight_layout(); fig.savefig(OUT/'fig1.png',dpi=180); plt.close(fig)
fig,ax=plt.subplots(figsize=(8,4.5)); s=pd.DataFrame(summary)
for j,fraction in enumerate([0.,.03]):
    g=s[(s.contamination==fraction)&s.method.isin(methods)].set_index('method').loc[methods]
    ax.bar(positions+(j-.5)*.35,g.oracle_regret,width=.32,yerr=1.96*g.oracle_regret_se,capsize=4,label=f'Contamination target {fraction:.0%}')
ax.set(xticks=positions,xticklabels=methods,ylabel='True utility regret (percentage points)',title='Synthetic data: mean and 1.96 Monte Carlo SE'); ax.legend(); fig.tight_layout(); fig.savefig(OUT/'fig2.png',dpi=180); plt.close(fig)
print(pd.DataFrame(summary).to_string(index=False))
