"""Independent synthetic illustration; not a replication of a cited paper."""
from pathlib import Path
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.optimize import linprog, minimize, LinearConstraint, Bounds

OUT = Path(__file__).resolve().parent
SEED, REPS, N, M, P, ALPHA = 202610051, 24, 100, 4000, 5, 0.90
RADII = [0.0, 0.03, 0.10, 0.25]
rng = np.random.default_rng(SEED)
mu = np.array([.060, .045, .030, .025, .020])
vol = np.array([.55, .85, 1., 1.15, 1.3])
cov = np.outer(vol, vol)*.20 + np.diag(vol**2*.80)
chol = np.linalg.cholesky(cov)

def draw(n, stress=False):
    x = (rng.normal(size=(n,P)) @ chol.T) / np.sqrt(rng.chisquare(5,size=n)[:,None]/5) * np.sqrt(3/5)
    if stress:
        x[:,0] *= 3.0
    return x + mu

def cvar(x):
    t = np.quantile(x, ALPHA)
    return float(t + np.maximum(x-t,0).mean()/(1-ALPHA))

def solve(x, radius):
    # Variables w (P), threshold t, and scenario hinge losses u (N).
    n=len(x); dim=P+1+n
    c=np.r_[-.2*x.mean(axis=0), 1., np.ones(n)/(n*(1-ALPHA))]
    a=np.zeros((n,dim)); a[:,:P]=-x; a[:,P]=-1; a[:,P+1:]=-np.eye(n)
    budget=np.r_[np.ones(P),np.zeros(n+1)][None,:]
    lp=linprog(c,A_ub=a,b_ub=np.zeros(n),A_eq=budget,b_eq=[1.],bounds=[(0,1)]*P+[(None,None)]+[(0,None)]*n,method='highs')
    assert lp.success, lp.message
    if radius==0: return lp.x[:P], True
    k=radius/(1-ALPHA)
    def objective(z): return float(c@z+k*np.linalg.norm(z[:P]))
    def jac(z):
        grad=c.copy(); grad[:P]+=k*z[:P]/np.linalg.norm(z[:P]); return grad
    lower=np.r_[np.zeros(P),-np.inf,np.zeros(n)]; upper=np.r_[np.ones(P),np.inf,np.full(n,np.inf)]
    fit=minimize(objective,lp.x,jac=jac,method='SLSQP',bounds=Bounds(lower,upper),constraints=[LinearConstraint(a,-np.inf,0),LinearConstraint(budget,1,1)],options={'ftol':1e-9,'maxiter':400})
    assert fit.success, fit.message
    assert abs(fit.x[:P].sum()-1)<1e-7 and np.min(fit.x[:P])>=-1e-7
    return fit.x[:P], bool(fit.success)

rows=[]; weight_rows=[]
for rep in range(REPS):
    train=draw(N); clean=draw(M); stress=draw(M,True)
    for radius in RADII:
        w,success=solve(train,radius)
        rows.append(dict(rep=rep,radius=radius,clean_cvar=cvar(-clean@w),stress_cvar=cvar(-stress@w),clean_mean=float((clean@w).mean()),concentration=float(w@w),solver_success=success))
        weight_rows.extend(dict(rep=rep,radius=radius,asset=j+1,weight=float(w[j])) for j in range(P))
    w=np.ones(P)/P
    rows.append(dict(rep=rep,radius=-1.,clean_cvar=cvar(-clean@w),stress_cvar=cvar(-stress@w),clean_mean=float((clean@w).mean()),concentration=float(w@w),solver_success=True))
df=pd.DataFrame(rows); df.to_csv(OUT/'replicates.csv',index=False)
weights=pd.DataFrame(weight_rows); weights.to_csv(OUT/'weights.csv',index=False)
summary=[]
for radius,g in df.groupby('radius',sort=True):
    d={'radius':float(radius),'n_replicates':len(g)}
    for key in ['clean_cvar','stress_cvar','clean_mean','concentration']:
        d[key]=float(g[key].mean()); d[key+'_se']=float(g[key].std(ddof=1)/np.sqrt(len(g)))
    summary.append(d)
(OUT/'results.json').write_text(json.dumps(dict(seed=SEED,reps=REPS,n_train=N,n_test=M,assets=P,alpha=ALPHA,units='daily percentage points',summary=summary),ensure_ascii=False,indent=2),encoding='utf-8')
plt.rcParams.update({'font.size':11,'axes.spines.top':False,'axes.spines.right':False})
fig,ax=plt.subplots(figsize=(8,4.5))
s=pd.DataFrame(summary); s=s[s.radius>=0]
for key,label in [('clean_cvar','Stationary test'),('stress_cvar','Asset 1 volatility x3')]:
    ax.errorbar(s.radius,s[key],yerr=1.96*s[key+'_se'],marker='o',capsize=4,label=label)
ax.set(xlabel='Wasserstein radius (percentage points)',ylabel='Test CVaR 90% (percentage points)',title='Synthetic data: mean and 1.96 Monte Carlo SE')
ax.legend(); fig.tight_layout(); fig.savefig(OUT/'fig1.png',dpi=180); plt.close(fig)
fig,ax=plt.subplots(figsize=(8,4.5))
piv=weights.groupby(['radius','asset']).weight.mean().unstack()
bottom=np.zeros(len(piv))
for j in piv.columns:
    ax.bar(np.arange(len(piv)),piv[j],bottom=bottom,label=f'Asset {j}'); bottom+=piv[j].to_numpy()
ax.set(xticks=np.arange(len(piv)),xticklabels=[str(x) for x in piv.index],xlabel='Wasserstein radius',ylabel='Mean portfolio weight',title='Synthetic data: concentration decreases with radius')
ax.legend(ncol=5,loc='lower center',bbox_to_anchor=(.5,1.0),frameon=False); ax.set_title('Synthetic data: concentration decreases with radius',pad=36); fig.tight_layout(); fig.savefig(OUT/'fig2.png',dpi=180); plt.close(fig)
print(pd.DataFrame(summary).to_string(index=False))
