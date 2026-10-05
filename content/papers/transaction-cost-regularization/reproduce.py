"""Synthetic monthly rebalancing: no market downloads, seed 20261005."""
from pathlib import Path
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.optimize import minimize

OUT = Path(__file__).resolve().parent
SEED, REPS, T, N = 20261005, 30, 120, 8
GAMMA, IMPACT = 4.0, 0.01
MULTIPLIERS = [0.0, 1.0, 3.0, 10.0]
SD = np.linspace(.035, .06, N)
COV = np.outer(SD, SD) * (.25 * np.ones((N,N)) + .75 * np.eye(N))
COST = np.linspace(.001, .004, N)

def solve(mu, previous, multiple):
    def objective(z):
        w,u=z[:N],z[N:]
        delta = w - previous
        exact_cost = COST @ u + IMPACT / 2 * (delta @ delta)
        return 1000*(-mu @ w + GAMMA / 2 * w @ COV @ w + multiple * exact_cost)
    def gradient(z):
        w=z[:N]
        d = w - previous
        return 1000*np.r_[-mu + GAMMA * COV @ w + multiple * IMPACT * d,multiple*COST]
    inequality_jac=np.block([[-np.eye(N),np.eye(N)],[np.eye(N),np.eye(N)]])
    fit = minimize(objective, np.r_[previous,np.zeros(N)], jac=gradient, method='SLSQP', bounds=[(0,1)]*N+[(0,2)]*N,
                   constraints=[{'type':'eq','fun':lambda z: z[:N].sum()-1,'jac':lambda z: np.r_[np.ones(N),np.zeros(N)]},
                                {'type':'ineq','fun':lambda z: np.r_[z[N:]-(z[:N]-previous),z[N:]+(z[:N]-previous)],'jac':lambda z:inequality_jac}],
                   options={'maxiter':250,'ftol':1e-10})
    if not fit.success:
        raise RuntimeError(fit.message)
    w = fit.x[:N]
    assert abs(w.sum()-1) < 1e-7 and w.min() > -1e-8
    return w

def main():
    rows, paths = [], []
    for rep in range(REPS):
        rng = np.random.default_rng(SEED + rep)
        means = np.empty((T,N)); latent = np.zeros(N)
        for t in range(T):
            latent = .97 * latent + rng.normal(0,.0009,N)
            means[t] = .004 + latent
        forecast = means + rng.normal(0,.009,(T,N))
        realized = means + rng.multivariate_normal(np.zeros(N), COV, T)
        assert realized.min() > -1
        for multiple in MULTIPLIERS:
            previous = np.full(N, 1/N); rets, turns, costs, wealth = [], [], [], [1.]
            for t in range(T):
                w = solve(forecast[t], previous, multiple)
                d = w-previous; fee = float(COST @ abs(d) + IMPACT / 2 * (d@d))
                gross = float(w @ realized[t]); net = (1-fee)*(1+gross)-1
                rets.append(net); turns.append(.5*abs(d).sum()); costs.append(fee)
                wealth.append(wealth[-1]*(1+net))
                previous = w*(1+realized[t])/(1+gross)
            rr=np.asarray(rets)
            rows.append({'rep':rep,'multiplier':multiple,'annual_arithmetic_return_pct':1200*rr.mean(),
                         'annual_volatility_pct':100*np.sqrt(12)*rr.std(ddof=1),
                         'sharpe':np.sqrt(12)*rr.mean()/rr.std(ddof=1),
                         'monthly_turnover_pct':100*np.mean(turns),'monthly_fee_bps':10000*np.mean(costs),
                         'terminal_wealth':wealth[-1]})
            for t, value in enumerate(wealth): paths.append({'rep':rep,'multiplier':multiple,'month':t,'wealth':value})
    raw=pd.DataFrame(rows); raw.to_csv(OUT/'results.csv',index=False)
    path=pd.DataFrame(paths);path.to_csv(OUT/'wealth.csv',index=False)
    columns=['annual_arithmetic_return_pct','annual_volatility_pct','sharpe','monthly_turnover_pct','monthly_fee_bps','terminal_wealth']
    records=[]
    for multiplier, group in raw.groupby('multiplier'):
        record={'multiplier':float(multiplier)}
        for col in columns:
            record[col]=float(group[col].mean());record[col+'_mcse']=float(group[col].std(ddof=1)/np.sqrt(REPS))
        records.append(record)
    with (OUT/'results.json').open('w',encoding='utf-8') as f: json.dump({'seed':SEED,'replications':REPS,'months':T,'assets':N,'summary':records},f,indent=2)
    plt.rcParams.update({'font.size':11,'axes.spines.top':False,'axes.spines.right':False})
    fig,ax=plt.subplots(figsize=(8,4.5))
    for multiplier, group in path.groupby('multiplier'):
        p=group.groupby('month')['wealth']; ax.plot(p.mean(),label=f'Cost multiplier {multiplier:g}')
    ax.set(xlabel='Month',ylabel='Mean net wealth',title='Synthetic monthly rebalancing: 30 paths');ax.legend()
    fig.tight_layout();fig.savefig(OUT/'fig1.png',dpi=180);plt.close(fig)
    fig,axes=plt.subplots(1,2,figsize=(9,4.5))
    for ax,col,title in zip(axes,['monthly_turnover_pct','monthly_fee_bps'],['Monthly turnover (%)','Actual trading fee (bps/month)']):
        ys=[r[col] for r in records];errors=[r[col+'_mcse'] for r in records]
        ax.bar([str(int(m)) for m in MULTIPLIERS],ys,yerr=errors,capsize=4,color=['#738696','#257b9b','#e9a44b','#745b92'])
        ax.set(xlabel='Cost multiplier',ylabel=title)
    fig.tight_layout();fig.savefig(OUT/'fig2.png',dpi=180);plt.close(fig)
    print(json.dumps(records,indent=2))

if __name__ == '__main__': main()
