# Deterministic two-period synthetic scenario-tree experiment.
# Run: Rscript --vanilla reproduce.R (output is written beside this script).
args <- commandArgs(trailingOnly = FALSE)
script <- sub("^--file=", "", args[grepl("^--file=", args)][1])
out <- dirname(script) # preserve UTF-8 path bytes; no normalizePath on this Windows locale
set.seed(20261005) # recorded for extensions; this exact enumeration draws no samples
alpha <- 0.75
r1 <- c(0.10, -0.20); p1 <- c(0.8, 0.2)
r2 <- list(c(0.18, -0.02, -0.35), c(0.30, 0.04, -0.15))
p2 <- list(c(0.7, 0.2, 0.1), c(0.3, 0.5, 0.2))
grid <- seq(0, 1, by=0.05)
cvar <- function(x, p, alpha=0.75) {
  min(vapply(sort(unique(x)), function(t) t + sum(p*pmax(x-t,0))/(1-alpha), numeric(1)))
}
rho <- function(x,p,lambda) (1-lambda)*sum(p*x)+lambda*cvar(x,p,alpha)
policies <- expand.grid(w0=grid, good=grid, bad=grid)
evaluate <- function(w0, good, bad, lambda) {
  wealth1 <- 1.01 + w0*(r1-0.01)
  wealth2 <- c(wealth1[1]*(1.01+good*(r2[[1]]-0.01)), wealth1[2]*(1.01+bad*(r2[[2]]-0.01)))
  probs <- c(p1[1]*p2[[1]], p1[2]*p2[[2]])
  loss <- 1-wealth2
  conditional <- c(rho(loss[1:3],p2[[1]],lambda),rho(loss[4:6],p2[[2]],lambda))
  c(static=rho(loss,probs,lambda),nested=rho(conditional,p1,lambda),
    mean_return=sum(probs*wealth2)-1,cvar=cvar(loss,probs),
    worst=min(wealth2)-1, good_risk=conditional[1],bad_risk=conditional[2])
}
lambdas <- c(0.1,0.25,0.35,0.4,0.5)
rows <- list(); pathrows <- list(); frontier <- list()
for (lambda in lambdas) {
  values <- t(vapply(seq_len(nrow(policies)),function(i) {
    z <- policies[i,]; evaluate(z$w0,z$good,z$bad,lambda)
  },numeric(7)))
  # Independent backward induction: positive wealth scales node losses, so the
  # minimizer at each stage-1 node is independent of the incoming wealth.
  good_dp <- grid[which.min(vapply(grid,function(w) rho(-(0.01+w*(r2[[1]]-0.01)),p2[[1]],lambda),numeric(1)))]
  bad_dp <- grid[which.min(vapply(grid,function(w) rho(-(0.01+w*(r2[[2]]-0.01)),p2[[2]],lambda),numeric(1)))]
  w0_dp <- grid[which.min(vapply(grid,function(w) evaluate(w,good_dp,bad_dp,lambda)["nested"],numeric(1)))]
  inest <- which.min(values[,"nested"])
  stopifnot(abs(evaluate(w0_dp,good_dp,bad_dp,lambda)["nested"]-values[inest,"nested"])<1e-10)
  for (method in c("static","nested")) {
    i <- which.min(values[,method]); z<-policies[i,]; v<-values[i,]
    revisions <- as.integer(abs(z$good-good_dp)>1e-10)+as.integer(abs(z$bad-bad_dp)>1e-10)
    rows[[length(rows)+1]] <- data.frame(lambda=lambda,method=method,w0=z$w0,good=z$good,bad=z$bad,
      t(v),revisions=revisions,good_reoptimized=good_dp,bad_reoptimized=bad_dp,check.names=FALSE)
    if(abs(lambda-0.4)<1e-10) {
      wealth1<-1.01+z$w0*(r1-0.01)
      pathrows[[length(pathrows)+1]]<-data.frame(method=method,path=paste0(rep(c("good","bad"),each=3),"-",rep(1:3,2)),
        probability=c(p1[1]*p2[[1]],p1[2]*p2[[2]]),return=c(wealth1[1]*(1.01+z$good*(r2[[1]]-0.01)),wealth1[2]*(1.01+z$bad*(r2[[2]]-0.01)))-1)
    }
  }
  frontier[[length(frontier)+1]] <- data.frame(lambda=lambda,static_min=min(values[,"static"]),nested_min=min(values[,"nested"]))
}
results<-do.call(rbind,rows); paths<-do.call(rbind,pathrows)
write.csv(results,file.path(out,"results.csv"),row.names=FALSE)
write.csv(paths,file.path(out,"terminal-paths.csv"),row.names=FALSE)
write.csv(do.call(rbind,frontier),file.path(out,"frontier.csv"),row.names=FALSE)
png(file.path(out,"fig1.png"),width=1600,height=1000,res=170)
par(mar=c(4.5,4.8,3,1),family="sans")
matplot(lambdas,cbind(results$good[results$method=="static"],results$good[results$method=="nested"],results$bad[results$method=="static"],results$bad[results$method=="nested"]),
  type="b",pch=c(16,17,15,18),lty=c(1,2,1,2),col=c("#155e75","#155e75","#9f1239","#9f1239"),
  xlab="Risk-mixture coefficient lambda",ylab="Risky-asset weight after observing a node",ylim=c(0,1),main="Static and nested risk choose different continuation policies")
legend("topright",legend=c("Static / good node","Nested / good node","Static / bad node","Nested / bad node"),col=c("#155e75","#155e75","#9f1239","#9f1239"),lty=c(1,2,1,2),pch=c(16,17,15,18),bty="n")
dev.off()
png(file.path(out,"fig2.png"),width=1600,height=1000,res=170)
par(mar=c(5,4.8,3,1),family="sans")
static <- paths$return[paths$method=="static"]; nested <- paths$return[paths$method=="nested"]
barplot(100*rbind(static,nested),beside=TRUE,names.arg=paths$path[paths$method=="static"],
 col=c("#155e75","#d97706"),ylab="Terminal return (%)",main="Exact terminal paths at lambda = 0.40")
abline(h=0,col="grey50")
legend("topright",c("Static commitment","Nested / backward induction"),fill=c("#155e75","#d97706"),bty="n")
dev.off()
cat("Enumerated policies per lambda:",nrow(policies),"\n")
print(results)
