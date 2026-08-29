import { getHistory } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Clock, GitCommit, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

function getRiskColorText(level: string) {
  switch (level.toLowerCase()) {
    case "critical": return "text-destructive";
    case "high": return "text-high";
    case "medium": return "text-medium";
    case "low": return "text-low";
    default: return "text-muted-foreground";
  }
}

export default function HistoryPage() {
  const history = getHistory();

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
            <span className="text-xs font-mono tracking-widest uppercase">Back</span>
          </Link>
        </div>
        <div className="flex items-center space-x-2 text-sm font-mono text-muted-foreground">
          <span>ANALYSIS HISTORY</span>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-6xl mx-auto w-full">
        <div className="mb-12">
          <h1 className="text-2xl font-mono uppercase tracking-widest text-foreground flex items-center gap-3">
            <Clock className="w-6 h-6 stroke-[1.5]" /> Risk Trend History
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Past merge conflict risk analyses.</p>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border">
            <ShieldAlert className="w-8 h-8 text-muted-foreground/50 mb-4 stroke-[1.5]" />
            <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">No history available</span>
          </div>
        ) : (
          <div className="border border-border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Date</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Repository</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hidden md:table-cell">Provider</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Branches</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, i) => (
                  <tr key={record.id || i} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                    <td className="p-4 font-mono text-xs text-muted-foreground">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-xs text-foreground/90 max-w-[200px] truncate">
                      {record.repo}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground uppercase hidden md:table-cell">
                      {record.provider}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-muted-foreground uppercase truncate max-w-[100px]">{record.baseBranch}</span>
                        <GitCommit className="w-3 h-3 text-muted-foreground stroke-[1.5]" />
                        <span className="font-mono text-[10px] text-muted-foreground uppercase truncate max-w-[100px]">{record.compareBranch}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={cn("font-mono text-lg", getRiskColorText(record.overallLevel))}>
                          {record.overallScore}
                        </span>
                        <span className={cn("font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border mt-1", getRiskColorText(record.overallLevel), `border-${record.overallLevel.toLowerCase()}/30`)}>
                          {record.overallLevel}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
