# Finite-support moment LP solved by complete basic-feasible-solution enumeration.
# This is a discretized moment experiment, not an SOS hierarchy implementation.
args <- commandArgs(trailingOnly = FALSE)
script <- sub("^--file=", "", args[grepl("^--file=", args)][1])
out <- dirname(script) # preserve UTF-8 path bytes; no normalizePath on this Windows locale
set.seed(20261005) # no random draws are used
z<-seq(-2,2,by=0.5)
p0<-c(0.03,0.07,0.12,0.18,0.20,0.18,0.12,0.07,0.03)
r_def<-0.025+0.005*z
r_risk<-0.060+0.050*z-0.008*z^2
tau<-0.020; kappa<-2
grid<-seq(0,1,by=0.002)
mu<-sum(p0*r_def)+grid*sum(p0*(r_risk-r_def))
enumerate_vertices <- function(degree) {
  A<-t(vapply(0:degree,function(k) z^k,numeric(length(z))))
  moments<-as.vector(A%*%p0)
  sets<-combn(length(z),degree+1,simplify=FALSE)
  candidates<-lapply(sets,function(ind) {
    solution<-tryCatch(solve(A[,ind,drop=FALSE],moments),error=function(e) NULL)
    if(is.null(solution)||min(solution) < -1e-9) return(NULL)
    q<-rep(0,length(z)); q[ind]<-pmax(solution,0)
    if(max(abs(A%*%q-moments))>1e-7) return(NULL)
    q
  })
  Q<-do.call(rbind,candidates[!vapply(candidates,is.null,logical(1))])
  keys<-apply(round(Q,12),1,function(row)paste(row,collapse=","))
  Q<-Q[!duplicated(keys),,drop=FALSE]
  list(Q=Q,A=A,moments=moments,sets=sets)
}
models<-lapply(2:4,enumerate_vertices)
lossmat<-vapply(grid,function(w) pmax(tau-((1-w)*r_def+w*r_risk),0),numeric(length(z)))
nominal<-as.vector(p0%*%lossmat)
curves<-data.frame(weight=grid,nominal=nominal)
worsts<-list(); results<-list()
for(j in seq_along(models)) {
  mod<-models[[j]]
  loss<-apply(mod$Q%*%lossmat,2,max)
  curves[[paste0("moments_",j+1)]]<-loss
  i<-which.min(-mu+kappa*loss)
  witness<-which.max(as.vector(mod$Q%*%lossmat[,i]))
  q<-mod$Q[witness,]
  # Enumerate every possible dual vertex, and select a feasible optimal
  # polynomial majorant on the nine support points.
  duals<-lapply(mod$sets,function(ind) {
    y<-tryCatch(solve(t(mod$A[,ind,drop=FALSE]),lossmat[ind,i]),error=function(e) NULL)
    if(is.null(y)||min(as.vector(t(mod$A)%*%y)-lossmat[,i]) < -1e-9) return(NULL)
    y
  })
  Y<-do.call(rbind,duals[!vapply(duals,is.null,logical(1))])
  obj<-as.vector(Y%*%mod$moments); y<-Y[which.min(obj),]
  dualvalue<-min(obj)
  stopifnot(abs(dualvalue-loss[i])<1e-8)
  results[[length(results)+1]]<-data.frame(model=paste0("moments_",j+1),weight=grid[i],
    expected_return=mu[i],nominal_shortfall=nominal[i],worst_shortfall=loss[i],objective=-mu[i]+kappa*loss[i],
    dual_value=dualvalue,duality_gap=abs(dualvalue-loss[i]),vertices=nrow(mod$Q))
  worsts[[j]]<-data.frame(model=paste0("moments_",j+1),factor=z,nominal_prob=p0,worst_prob=q,
    loss=lossmat[,i],dual_majorant=as.vector(t(mod$A)%*%y))
  write.csv(data.frame(degree=0:(j+1),coefficient=y,moment=mod$moments),file.path(out,paste0("dual-moments-",j+1,".csv")),row.names=FALSE)
}
i<-which.min(-mu+kappa*nominal)
results[[length(results)+1]]<-data.frame(model="nominal",weight=grid[i],expected_return=mu[i],nominal_shortfall=nominal[i],
  worst_shortfall=nominal[i],objective=-mu[i]+kappa*nominal[i],dual_value=NA,duality_gap=NA,vertices=1)
results<-do.call(rbind,results)
worsts<-do.call(rbind,worsts)
write.csv(results,file.path(out,"results.csv"),row.names=FALSE)
write.csv(curves,file.path(out,"shortfall-curves.csv"),row.names=FALSE)
write.csv(worsts,file.path(out,"worst-distributions.csv"),row.names=FALSE)
write.csv(data.frame(factor=z,nominal_prob=p0,defensive_return=r_def,risky_return=r_risk),file.path(out,"support.csv"),row.names=FALSE)
png(file.path(out,"fig1.png"),width=1600,height=1000,res=170)
par(mar=c(4.5,4.8,3,1),family="sans")
matplot(grid,100*as.matrix(curves[,-1]),type="l",lwd=2,lty=c(2,1,1,1),col=c("#475569","#b91c1c","#d97706","#155e75"),
  xlab="Risky-asset weight",ylab="Expected target shortfall (% of initial wealth)",main="Adding moment constraints reduces the worst-case loss")
legend("topleft",c("Nominal distribution","Mean + variance","Up to third moment","Up to fourth moment"),lty=c(2,1,1,1),lwd=2,col=c("#475569","#b91c1c","#d97706","#155e75"),bty="n")
dev.off()
png(file.path(out,"fig2.png"),width=1600,height=1000,res=170)
par(mar=c(4.5,4.8,3,1),family="sans")
q2<-worsts$worst_prob[worsts$model=="moments_2"];q4<-worsts$worst_prob[worsts$model=="moments_4"]
barplot(rbind(p0,q2,q4),beside=TRUE,names.arg=z,col=c("#475569","#b91c1c","#155e75"),xlab="Synthetic factor support z",ylab="Probability mass",main="Worst-case distributions at their selected portfolio weights")
legend("topright",c("Nominal","Mean + variance worst case","Fourth-moment worst case"),fill=c("#475569","#b91c1c","#155e75"),bty="n")
dev.off()
print(results)
cat("Nominal moments:",vapply(0:4,function(k)sum(p0*z^k),numeric(1)),"\n")
