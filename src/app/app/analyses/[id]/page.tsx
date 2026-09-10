import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, GitCommit, FileText, ActivitySquare, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AnalysisDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  const analysis = await db.analysis.findUnique({
    where: { id: params.id },
    include: {
      repository: true,
      pullRequest: true,
      findings: true
    }
  });

  if (!analysis) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center justify-center text-center h-[50vh]">
        <ShieldAlert className="w-8 h-8 text-destructive mb-4" />
        <h1 className="text-xl font-mono mb-2">Analysis not found</h1>
        <p className="text-muted-foreground font-mono text-sm">This analysis may have been deleted.</p>
        <Link href="/app/repositories" className="mt-6 text-sm uppercase tracking-widest bg-foreground text-background px-4 py-2 hover:bg-foreground/90 transition-colors">
          Back to Repositories
        </Link>
      </div>
    );
  }

  const riskBg = analysis.riskLevel === "Critical" ? "bg-destructive/10 border-destructive/30" : 
                analysis.riskLevel === "High" ? "bg-high/10 border-high/30" : 
                analysis.riskLevel === "Medium" ? "bg-medium/10 border-medium/30" : "bg-low/10 border-low/30";
  
  const riskText = analysis.riskLevel === "Critical" ? "text-destructive" : 
                  analysis.riskLevel === "High" ? "text-high" : 
                  analysis.riskLevel === "Medium" ? "text-medium" : "text-low";

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative z-10 flex flex-col h-full overflow-y-auto">
      <div className="mb-8 border-b border-border pb-4 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-2xl font-mono uppercase font-bold tracking-tight">Analysis Details</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            {analysis.repository.fullName}
          </p>
        </div>
        <Link href={`/app/analyses?repo=${encodeURIComponent(analysis.repository.fullName)}`} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          &larr; Back to History
        </Link>
      </div>

      <div className={cn("border border-border p-8 rounded-sm mb-8 flex items-center justify-between", riskBg)}>
        <div>
          <div className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-1">Overall Risk</div>
          <div className={cn("text-6xl font-mono font-bold tracking-tighter mb-2", riskText)}>
            {analysis.riskScore}%
          </div>
          <div className={cn("text-lg font-mono uppercase tracking-widest", riskText)}>
            {analysis.riskLevel}
          </div>
        </div>
        <div className="text-right space-y-4">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Context</div>
            {analysis.pullRequest ? (
              <div className="text-sm font-mono flex items-center justify-end space-x-2">
                <span>PR #{analysis.pullRequest.number}</span>
                <span className="text-muted-foreground">({analysis.pullRequest.targetBranch} &larr; {analysis.pullRequest.sourceBranch})</span>
              </div>
            ) : (
              <div className="text-sm font-mono">Manual Analysis</div>
            )}
          </div>
          {analysis.commitSha && (
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Commit</div>
              <div className="text-sm font-mono flex items-center justify-end space-x-2">
                <GitCommit className="w-4 h-4 text-muted-foreground" />
                <span>{analysis.commitSha.substring(0, 7)}</span>
              </div>
            </div>
          )}
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Completed</div>
            <div className="text-sm font-mono">
              {new Date(analysis.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-6">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-xl font-mono uppercase tracking-widest">{analysis.findings.length} Conflict Findings</h2>
        </div>

        {analysis.findings.length === 0 ? (
          <div className="p-8 border border-border bg-background/50 text-center rounded-sm">
            <CheckCircle2 className="w-8 h-8 text-low mx-auto mb-4" />
            <div className="font-mono text-lg">Clean Merge Expected</div>
            <div className="text-muted-foreground text-sm mt-2">No structural overlaps or potential merge conflicts were detected.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {analysis.findings.map((finding) => (
              <div key={finding.id} className="border border-border p-5 rounded-sm bg-background">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{finding.filePath}</span>
                  </div>
                  <div className={cn(
                    "text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-sm border",
                    finding.severity === "Critical" ? "bg-destructive/10 text-destructive border-destructive/30" :
                    finding.severity === "High" ? "bg-high/10 text-high border-high/30" :
                    finding.severity === "Medium" ? "bg-medium/10 text-medium border-medium/30" :
                    "bg-low/10 text-low border-low/30"
                  )}>
                    {finding.severity} Risk
                  </div>
                </div>
                
                <div className="text-sm bg-secondary/20 p-4 border-l-2 border-border font-mono leading-relaxed">
                  {finding.explanation || `Detected ${finding.conflictType.toLowerCase().replace(/_/g, " ")} in this file.`}
                </div>

                {(finding.lineStart || finding.lineEnd) && (
                  <div className="mt-4 text-xs font-mono text-muted-foreground flex items-center space-x-2">
                    <ActivitySquare className="w-3 h-3" />
                    <span>Lines {finding.lineStart || "?"} - {finding.lineEnd || "?"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
