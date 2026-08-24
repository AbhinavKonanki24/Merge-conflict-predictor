"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, RefreshCcw, Check, Circle, Loader2, ChevronRight, Maximize2, ShieldAlert } from "lucide-react";
import { DEMO_BRANCHES, DEMO_PREDICTION } from "@/lib/demo-data";
import { PredictionResult, FileRisk } from "@/lib/predictor";
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

function getRiskColorBg(level: string) {
  switch (level.toLowerCase()) {
    case "critical": return "bg-destructive";
    case "high": return "bg-high";
    case "medium": return "bg-medium";
    case "low": return "bg-low";
    default: return "bg-muted";
  }
}

import { Suspense } from "react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const repoPath = searchParams.get("repo");
  
  const isDemo = repoPath === "DEMO_MODE";

  const [branches, setBranches] = useState<string[]>([]);
  const [baseBranch, setBaseBranch] = useState("");
  const [compareBranch, setCompareBranch] = useState("");
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const [selectedFile, setSelectedFile] = useState<FileRisk | null>(null);

  useEffect(() => {
    if (!repoPath) {
      router.push("/");
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "R" || e.key === "r") {
        if (!isAnalyzing && baseBranch && compareBranch) runAnalysis();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [repoPath, isAnalyzing, baseBranch, compareBranch]);

  useEffect(() => {
    if (!repoPath) return;

    if (isDemo) {
      setBranches(DEMO_BRANCHES.branches);
      setBaseBranch("main");
      setCompareBranch("feature/payment");
      setIsLoadingBranches(false);
    } else {
      fetch(`/api/repo/branches?path=${encodeURIComponent(repoPath)}`)
        .then(res => res.json())
        .then(data => {
          if (data.branches) {
            setBranches(data.branches);
            setBaseBranch("main");
            setCompareBranch(data.current !== "main" ? data.current : data.branches[1] || "");
          }
        })
        .finally(() => setIsLoadingBranches(false));
    }
  }, [repoPath, isDemo]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setResult(null);
    setSelectedFile(null);

    const stages = [
      "Repository",
      "Merge base",
      "Branch history",
      "Changed regions",
      "Conflict prediction",
      "Risk analysis"
    ];

    for (let i = 0; i <= stages.length; i++) {
      setAnalysisStage(i);
      if (i < stages.length) {
        await new Promise(r => setTimeout(r, isDemo ? 200 : 350));
      }
    }

    if (isDemo) {
      setResult(DEMO_PREDICTION);
      setIsAnalyzing(false);
      return;
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath, baseBranch, compareBranch })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stages = [
    "Repository",
    "Merge base",
    "Branch history",
    "Changed regions",
    "Conflict prediction",
    "Risk analysis"
  ];

  if (isLoadingBranches) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-4 h-4 border border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative z-10">
      {/* Top Bar Minimal */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm z-50">
        <div className="flex items-center space-x-2 text-sm font-mono text-muted-foreground truncate max-w-xs">
          <span>{isDemo ? "DEMO_MODE" : repoPath}</span>
        </div>

        {/* Minimal Branch Selector */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center space-x-4 text-xs font-mono font-medium">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">Base</span>
            <select 
              value={baseBranch} 
              onChange={e => { setBaseBranch(e.target.value); setResult(null); }}
              className="bg-transparent text-foreground focus:outline-none cursor-pointer appearance-none text-right hover:text-muted-foreground transition-colors"
            >
              {branches.map(b => <option key={b} value={b} className="bg-background text-foreground">{b}</option>)}
            </select>
          </div>
          
          <div className="h-4 w-[1px] bg-border rotate-12" />
          
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">Compare</span>
            <select 
              value={compareBranch} 
              onChange={e => { setCompareBranch(e.target.value); setResult(null); }}
              className="bg-transparent text-foreground focus:outline-none cursor-pointer appearance-none hover:text-muted-foreground transition-colors"
            >
              {branches.map(b => <option key={b} value={b} className="bg-background text-foreground">{b}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Search className="w-4 h-4 stroke-[1.5]" />
          </button>
          <button onClick={runAnalysis} disabled={isAnalyzing || baseBranch === compareBranch} className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
            <RefreshCcw className={cn("w-4 h-4 stroke-[1.5]", isAnalyzing && "animate-spin")} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          
          <AnimatePresence mode="wait">
            {!result && !isAnalyzing && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center space-y-8"
              >
                <div className="flex flex-col items-center">
                  <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-4">Readiness</span>
                  <button 
                    onClick={runAnalysis}
                    className="bg-foreground text-background px-8 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors uppercase tracking-widest"
                  >
                    Analyze Merge Risk
                  </button>
                </div>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <div className="w-full max-w-sm">
                  <div className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-8 text-center">
                    ANALYZING
                  </div>
                  <div className="space-y-4">
                    {stages.map((stage, i) => (
                      <div key={stage} className="flex items-center space-x-4">
                        {analysisStage > i ? (
                          <Check className="w-4 h-4 text-foreground stroke-[2]" />
                        ) : analysisStage === i ? (
                          <div className="w-4 h-4 border border-foreground border-r-transparent rounded-full animate-spin" />
                        ) : (
                          <Circle className="w-4 h-4 text-border stroke-[1.5]" />
                        )}
                        <span className={cn(
                          "font-mono text-sm transition-colors duration-300",
                          analysisStage > i ? "text-muted-foreground" : analysisStage === i ? "text-foreground" : "text-muted-foreground/30"
                        )}>
                          {stage}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                className="flex flex-col h-full space-y-12"
              >
                {/* Hero Risk Section */}
                <div className="flex flex-col items-center justify-center pt-8">
                  <div className="text-[96px] leading-none font-mono tracking-tighter text-foreground mb-4">
                    {result.overallScore}
                  </div>
                  <div className="flex items-center space-x-3 mb-6">
                    <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground">MERGE RISK</span>
                    <span className={cn("font-mono text-xs tracking-widest uppercase px-2 py-0.5 border", getRiskColorText(result.overallLevel), `border-${result.overallLevel.toLowerCase()}/30`)}>
                      {result.overallLevel}
                    </span>
                  </div>
                  <p className="text-foreground/80 font-sans text-lg max-w-xl text-center">
                    {result.files.filter(f => f.level === "High" || f.level === "Critical").length} high-risk conflict zones detected across {result.files.length} changed files.
                  </p>
                </div>

                {/* Main Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 min-h-[500px]">
                  
                  {/* Left: Hotspots List */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h3 className="font-mono text-xs tracking-widest uppercase text-muted-foreground">Hotspots</h3>
                      <span className="font-mono text-xs text-muted-foreground">{result.files.length}</span>
                    </div>

                    <div className="space-y-4">
                      {result.files.map((file, idx) => {
                        const isSelected = selectedFile?.file === file.file;
                        return (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedFile(file)}
                            className={cn(
                              "group cursor-pointer p-3 border transition-colors",
                              isSelected ? "border-foreground bg-secondary/20" : "border-transparent hover:border-border"
                            )}
                          >
                            <div className="flex justify-between items-baseline mb-2">
                              <span className="font-mono text-sm truncate pr-4 text-foreground/90">{file.file.split("/").pop()}</span>
                              <span className={cn("font-mono text-xs", getRiskColorText(file.level))}>{file.score}</span>
                            </div>
                            
                            {/* Minimal Bar */}
                            <div className="w-full h-[2px] bg-border relative">
                              <div 
                                className={cn("absolute top-0 left-0 h-full", getRiskColorBg(file.level))} 
                                style={{ width: `${file.score}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Detailed View & Diff */}
                  <div className="lg:col-span-8 flex flex-col h-full border border-border bg-card/20 p-6 relative group">
                    {!selectedFile ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground font-mono text-xs uppercase tracking-widest">
                        Select a hotspot to view details
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        {/* File Header */}
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <h3 className="font-mono text-sm text-foreground mb-2 break-all">{selectedFile.file}</h3>
                            <div className="flex items-center space-x-2">
                              <span className={cn("font-mono text-xs", getRiskColorText(selectedFile.level))}>{selectedFile.score} / 100</span>
                              <span className="text-muted-foreground text-xs font-mono">•</span>
                              <span className="font-mono text-xs text-muted-foreground">{selectedFile.commitFrequency} recent commits</span>
                            </div>
                          </div>
                          <button className="p-2 border border-border text-muted-foreground hover:text-foreground transition-colors">
                            <Maximize2 className="w-4 h-4 stroke-[1.5]" />
                          </button>
                        </div>

                        {/* Explanation Panel */}
                        <div className="mb-8">
                          <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Why is this risky?</h4>
                          <ul className="space-y-3">
                            {selectedFile.reasons.map((reason, i) => (
                              <li key={i} className="flex items-start space-x-3 text-sm">
                                <span className="text-muted-foreground mt-0.5 font-mono text-xs">{(i+1).toString().padStart(2, '0')}</span>
                                <span className="text-foreground/90">{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Futuristic Diff Viewer */}
                        <div className="flex-1 min-h-[300px] border border-border bg-background flex flex-col overflow-hidden relative">
                           {/* Diff Header */}
                           <div className="h-8 border-b border-border flex items-center justify-between px-4 bg-secondary/30">
                              <span className="font-mono text-[10px] text-muted-foreground uppercase">{baseBranch}</span>
                              <span className="font-mono text-[10px] text-muted-foreground uppercase">{compareBranch}</span>
                           </div>

                           {/* Mock Diff Content */}
                           <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-loose relative flex">
                              {/* Left Column (Base) */}
                              <div className="flex-1 border-r border-border/50 pr-4">
                                {selectedFile.baseLinesChanged.length > 0 ? (
                                  <div className="text-muted-foreground space-y-1">
                                    <div className="text-foreground/30">...</div>
                                    <div className="flex space-x-4"><span className="opacity-30">125</span><span>{"function check() {"}</span></div>
                                    <div className="flex space-x-4"><span className="opacity-30">126</span><span>{"  // Base changes"}</span></div>
                                    <div className="flex space-x-4"><span className="opacity-30">127</span><span>{"  return true;"}</span></div>
                                    <div className="flex space-x-4"><span className="opacity-30">128</span><span>{"}"}</span></div>
                                    <div className="text-foreground/30">...</div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground/30 flex items-center justify-center h-full">Unchanged</div>
                                )}
                              </div>
                              
                              {/* Right Column (Compare) */}
                              <div className="flex-1 pl-4 relative">
                                {selectedFile.compareLinesChanged.length > 0 ? (
                                  <div className="text-muted-foreground space-y-1 relative z-10">
                                    <div className="text-foreground/30">...</div>
                                    <div className="flex space-x-4"><span className="opacity-30">125</span><span>{"function check() {"}</span></div>
                                    <div className="flex space-x-4"><span className="opacity-30">126</span><span className="text-foreground">{"  // Compare changes"}</span></div>
                                    <div className="flex space-x-4"><span className="opacity-30">127</span><span className="text-foreground">{"  return false;"}</span></div>
                                    <div className="flex space-x-4"><span className="opacity-30">128</span><span>{"}"}</span></div>
                                    <div className="text-foreground/30">...</div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground/30 flex items-center justify-center h-full">Unchanged</div>
                                )}

                                {/* Conflict Zone Overlay */}
                                {selectedFile.overlappingLines.length > 0 && (
                                  <div className="absolute top-8 left-0 w-full h-[60px] bg-destructive/10 border-l-[2px] border-destructive -ml-4 pl-4 pointer-events-none flex flex-col justify-end">
                                    <span className="font-mono text-[9px] text-destructive tracking-widest uppercase mb-1 absolute bottom-0 left-4">Predicted Conflict Zone</span>
                                  </div>
                                )}
                              </div>
                           </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
