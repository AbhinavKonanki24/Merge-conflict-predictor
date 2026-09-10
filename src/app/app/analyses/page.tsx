import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import Link from "next/link";
import { GitPullRequest, GitMerge, Clock, FileText, AlertCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AnalysesHistoryPage({ searchParams }: { searchParams: { repo?: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  const { repo } = searchParams;
  
  let analyses;

  if (repo) {
    const repository = await db.repository.findUnique({
      where: { fullName: repo }
    });

    if (!repository) {
      return (
        <div className="p-8 max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center justify-center text-center h-[50vh]">
          <AlertCircle className="w-8 h-8 text-muted-foreground mb-4" />
          <h1 className="text-xl font-mono mb-2">Repository not found</h1>
          <p className="text-muted-foreground font-mono text-sm">We couldn't find any analysis history for this repository.</p>
        </div>
      );
    }

    analyses = await db.analysis.findMany({
      where: { repositoryId: repository.id },
      include: {
        pullRequest: true,
        repository: true,
        findings: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } else {
    // Show user's recent analyses across all their repos
    // We would ideally filter by user's orgs/installations here, but for simplicity we fetch all 
    // where they have access. For this MVP, let's fetch globally or based on what they've accessed.
    // For safety, let's require a repo parameter.
    redirect("/app/repositories");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative z-10 flex flex-col h-full overflow-y-auto">
      <div className="mb-8 border-b border-border pb-4 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-2xl font-mono uppercase font-bold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            {repo}
          </p>
        </div>
        <Link href="/app/repositories" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          &larr; Back to Repositories
        </Link>
      </div>

      {analyses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-sm">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-mono mb-2">No historical analyses</h3>
          <p className="text-sm text-muted-foreground">Run a prediction on a PR to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => {
            const riskBg = analysis.riskLevel === "Critical" ? "bg-destructive/10 border-destructive/30" : 
                          analysis.riskLevel === "High" ? "bg-high/10 border-high/30" : 
                          analysis.riskLevel === "Medium" ? "bg-medium/10 border-medium/30" : "bg-low/10 border-low/30";
            
            const riskText = analysis.riskLevel === "Critical" ? "text-destructive" : 
                            analysis.riskLevel === "High" ? "text-high" : 
                            analysis.riskLevel === "Medium" ? "text-medium" : "text-low";

            return (
              <Link key={analysis.id} href={`/app/analyses/${analysis.id}`} className={cn("block border border-border p-5 rounded-sm hover:border-foreground transition-all bg-background", riskBg)}>
                <div className="flex justify-between items-start">
                  <div className="flex space-x-4">
                    <div className="mt-1">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-1 flex items-center space-x-2">
                        {analysis.pullRequest ? (
                          <><span>{analysis.pullRequest.title}</span> <span className="text-muted-foreground font-mono text-sm">#{analysis.pullRequest.number}</span></>
                        ) : (
                          <span>Manual Analysis</span>
                        )}
                      </h3>
                      
                      <div className="mt-4 flex items-center space-x-4">
                        {analysis.pullRequest && (
                          <div className="flex items-center space-x-1 text-xs font-mono bg-background/50 px-2 py-1 rounded-sm border border-border/50">
                            <GitMerge className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{analysis.pullRequest.targetBranch} &larr; {analysis.pullRequest.sourceBranch}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-xs font-mono">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{new Date(analysis.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className={cn("text-xl font-mono font-bold tracking-tight", riskText)}>
                      {analysis.riskScore}%
                    </div>
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      {analysis.riskLevel} Risk
                    </div>
                    <div className="mt-2 text-xs font-mono text-muted-foreground">
                      {analysis.conflictCount} Conflicts
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
