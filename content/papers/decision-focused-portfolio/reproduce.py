"""Exact decision geometry with a deliberately restricted predictor; synthetic data."""
from pathlib import Path
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

OUT=Path(__file__).resolve().parent
SEED,REPS,NTRAIN,NVALID,NTEST=20261006,60,80,120,400
N,GAMMA=6,10.
SD=np.array([.025,.03,.04,.05,.06,.08])
COV=np.outer(SD,SD)*(.2*np.ones((N,N))+.8*np.eye(N))
INV=np.linalg.inv(COV);one=np.ones(N)
P=INV-np.outer(INV@one,INV@one)/(one@INV@one)
BASE=(INV@one)/(one@INV@one)
B=np.array([1,.6,.2,-.2,-.6,-1.])
A=np.array([.008,.006,.003,.001,-.002,-.004])
C=np.array([.002,-.003,.005,-.005,.003,-.002])
D=np.array([.002,-.001,.003,-.002,.001,-.003])
TRUST=.0025

def generate(rng,n):
    x=rng.uniform(-1,1,(n,3))
    mu=.004+x[:,0,None]*A+x[:,1,None]*C+(x[:,0,None]**2-1/3)*D
    y=mu+rng.multivariate_normal(np.zeros(N),COV,n)
    return x,mu,y

def weights(mu): return BASE+mu@P/GAMMA
def regret(pred,mu):
    e=pred-mu;return np.einsum('bi,ij,bj->b',e,P,e)/(2*GAMMA)

def main():
    rows=[]
    for rep in range(REPS):
        rng=np.random.default_rng(SEED+rep)
        x,mu,y=generate(rng,NTRAIN);xv,muv,yv=generate(rng,NVALID);xt,mut,yt=generate(rng,NTEST)
        theta_ols=np.linalg.lstsq(x,(y-.004)@B/(B@B),rcond=None)[0]
        theta_dec=np.linalg.lstsq(x,(y-.004)@P@B/(B@P@B),rcond=None)[0]
        direction=theta_dec-theta_ols
        max_alpha=min(1.,TRUST/max(np.linalg.norm(direction),1e-15))
        alphas=np.linspace(0,max_alpha,5)
        validation=[regret(.004+np.outer(xv@(theta_ols+a*direction),B),yv).mean() for a in alphas]
        alpha=float(alphas[np.argmin(validation)])
        methods={'Prediction MSE':theta_ols,'Decision metric':theta_dec,'Trust correction':theta_ols+alpha*direction}
        for method,theta in methods.items():
            pred=.004+np.outer(xt@theta,B);w=weights(pred);oracle=weights(mut)
            rr=regret(pred,mut)
            utility=lambda ww: np.sum(ww*mut,axis=1)-GAMMA/2*np.einsum('bi,ij,bj->b',ww,COV,ww)
            assert np.allclose(rr,utility(oracle)-utility(w),atol=1e-12)
            assert np.allclose(w.sum(axis=1),1,atol=1e-10)
            rows.append({'rep':rep,'method':method,'prediction_mse_times_1e4':1e4*np.mean((pred-mut)**2),
                         'monthly_regret_bps':1e4*rr.mean(),'mean_gross_exposure':np.mean(abs(w).sum(axis=1)),
                         'correction_norm':float(np.linalg.norm(theta-theta_ols)),
                         'selected_alpha':alpha if method=='Trust correction' else (1. if method=='Decision metric' else 0.)})
    raw=pd.DataFrame(rows);raw.to_csv(OUT/'results.csv',index=False)
    records=[]
    for method in methods:
        group=raw[raw.method==method];r={'method':method}
        for col in ['prediction_mse_times_1e4','monthly_regret_bps','mean_gross_exposure','correction_norm','selected_alpha']:
            r[col]=float(group[col].mean());r[col+'_mcse']=float(group[col].std(ddof=1)/np.sqrt(REPS))
        records.append(r)
    with (OUT/'results.json').open('w',encoding='utf-8') as f: json.dump({'seed':SEED,'replications':REPS,'ntrain':NTRAIN,'nvalid':NVALID,'ntest':NTEST,'summary':records},f,indent=2)
    plt.rcParams.update({'font.size':11,'axes.spines.top':False,'axes.spines.right':False})
    fig,ax=plt.subplots(figsize=(8,4.5))
    ax.bar([r['method'] for r in records],[r['monthly_regret_bps'] for r in records],yerr=[r['monthly_regret_bps_mcse'] for r in records],capsize=5,color=['#738696','#257b9b','#e9a44b'])
    ax.set(ylabel='Monthly conditional utility regret (bps)',title='Synthetic contextual portfolio: 60 replications')
    fig.tight_layout();fig.savefig(OUT/'fig1.png',dpi=180);plt.close(fig)
    fig,ax=plt.subplots(figsize=(8,4.5))
    for method,col in zip(methods,['#738696','#257b9b','#e9a44b']):
        group=raw[raw.method==method]
        ax.scatter(group.prediction_mse_times_1e4,group.monthly_regret_bps,label=method,alpha=.55,c=col,s=27)
    ax.set(xlabel='Conditional mean prediction MSE (x 1e-4)',ylabel='Monthly utility regret (bps)');ax.legend()
    fig.tight_layout();fig.savefig(OUT/'fig2.png',dpi=180);plt.close(fig)
    print(json.dumps(records,indent=2))

if __name__=='__main__':main()
