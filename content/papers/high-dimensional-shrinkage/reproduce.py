"""Fixed linear shrinkage diagnostic, not the 2025 eigenvector-shrinkage method."""
from pathlib import Path
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

OUT=Path(__file__).resolve().parent
SEED, REPS, P = 202610052, 100, 40
SIZES=[60,90,180]
rng=np.random.default_rng(SEED)
beta=np.linspace(.4,1.2,P)
specific=np.linspace(.45,1.15,P)
cov=np.outer(beta,beta)*.6**2+np.diag(specific**2)
chol=np.linalg.cholesky(cov)

def gmv(s):
    x=np.linalg.solve(s,np.ones(P)); return x/x.sum()

oracle=gmv(cov); oracle_var=float(oracle@cov@oracle)
rows=[]; spectrum=[]
for n in SIZES:
    for rep in range(REPS):
        x=rng.normal(size=(n,P))@chol.T
        sample=np.cov(x,rowvar=False,ddof=1)
        target=np.eye(P)*np.trace(sample)/P
        candidates={'Sample':sample,'Shrink 0.2':.8*sample+.2*target,'Shrink 0.5':.5*sample+.5*target,'Equal weight':None,'Oracle':cov}
        for method,s in candidates.items():
            w=np.ones(P)/P if s is None else gmv(s)
            var=float(w@cov@w)
            rows.append(dict(n_train=n,rep=rep,method=method,risk_ratio=var/oracle_var,true_vol=np.sqrt(var),leverage=float(np.abs(w).sum()),estimated_vol=np.nan if s is None else np.sqrt(float(w@s@w)),condition_number=np.nan if s is None else np.linalg.cond(s)))
        if n==60 and rep==0:
            for method,s in [('Population',cov),('Sample',sample),('Shrink 0.2',candidates['Shrink 0.2']),('Shrink 0.5',candidates['Shrink 0.5'])]:
                spectrum.extend(dict(method=method,index=i+1,eigenvalue=float(e)) for i,e in enumerate(np.linalg.eigvalsh(s)))
df=pd.DataFrame(rows); df.to_csv(OUT/'replicates.csv',index=False)
sp=pd.DataFrame(spectrum); sp.to_csv(OUT/'spectrum.csv',index=False)
summary=[]
for (n,method),g in df.groupby(['n_train','method'],sort=False):
    d={'n_train':int(n),'method':method,'n_replicates':len(g)}
    for key in ['risk_ratio','true_vol','leverage','estimated_vol','condition_number']:
        d[key]=None if g[key].isna().all() else float(g[key].mean())
        d[key+'_se']=None if g[key].isna().all() else float(g[key].std(ddof=1)/np.sqrt(len(g)))
    summary.append(d)
(OUT/'results.json').write_text(json.dumps(dict(seed=SEED,reps=REPS,assets=P,oracle_vol=float(np.sqrt(oracle_var)),units='daily percentage points',summary=summary),ensure_ascii=False,indent=2),encoding='utf-8')
plt.rcParams.update({'font.size':11,'axes.spines.top':False,'axes.spines.right':False})
fig,ax=plt.subplots(figsize=(8,4.5)); s=pd.DataFrame(summary)
for method in ['Sample','Shrink 0.2','Shrink 0.5','Equal weight']:
    g=s[s.method==method]
    ax.errorbar(g.n_train,g.risk_ratio,yerr=1.96*g.risk_ratio_se,marker='o',capsize=4,label=method)
ax.axhline(1,color='gray',ls='--'); ax.set(xlabel='Training observations',ylabel='True variance / oracle variance',title='Synthetic factor model: mean and 1.96 Monte Carlo SE'); ax.legend(); fig.tight_layout(); fig.savefig(OUT/'fig1.png',dpi=180); plt.close(fig)
fig,ax=plt.subplots(figsize=(8,4.5))
for method,g in sp.groupby('method',sort=False): ax.plot(g['index'],g.eigenvalue,label=method)
ax.set(yscale='log',xlabel='Ordered eigenvalue index',ylabel='Eigenvalue (log scale)',title='Synthetic data: first replicate, n=60, p=40'); ax.legend(); fig.tight_layout(); fig.savefig(OUT/'fig2.png',dpi=180); plt.close(fig)
print(pd.DataFrame(summary).to_string(index=False))
