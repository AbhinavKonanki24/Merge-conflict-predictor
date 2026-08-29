"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FolderGit2, Globe, Key } from "lucide-react";

function BackgroundGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute left-1/2 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<"local" | "github">("local");
  const [repoPath, setRepoPath] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (provider === "local") {
      if (!repoPath) { setIsLoading(false); return; }
      try {
        const res = await fetch(`/api/repo/status?path=${encodeURIComponent(repoPath)}`);
        const data = await res.json();
        
        if (res.ok && data.valid) {
          router.push(`/dashboard?repo=${encodeURIComponent(repoPath)}`);
        } else {
          setError("Invalid Git repository path.");
        }
      } catch {
        setError("Failed to validate repository.");
      }
    } else {
      if (!githubRepo) { setIsLoading(false); return; }
      const parts = githubRepo.split("/");
      if (parts.length !== 2) {
        setError("Format must be owner/repo");
        setIsLoading(false);
        return;
      }
      try {
        const headers: Record<string, string> = {};
        if (githubToken) {
          headers["Authorization"] = `Bearer ${githubToken}`;
        }
        const res = await fetch(`https://api.github.com/repos/${parts[0]}/${parts[1]}`, { headers });
        if (res.ok) {
          if (githubToken) {
            sessionStorage.setItem("gh_token", githubToken);
          } else {
            sessionStorage.removeItem("gh_token");
          }
          router.push(`/dashboard?provider=github&owner=${encodeURIComponent(parts[0])}&repo=${encodeURIComponent(parts[1])}`);
        } else {
          setError("GitHub repository not found or inaccessible.");
        }
      } catch {
        setError("Failed to validate GitHub repository.");
      }
    }
    setIsLoading(false);
  };

  const handleDemo = () => {
    router.push("/dashboard?repo=DEMO_MODE");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden font-sans">
      <BackgroundGrid />

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl p-8 flex flex-col items-center"
      >
        <div className="text-center mb-16">
          <h1 className="text-[28px] md:text-[36px] font-medium tracking-tight text-foreground mb-4 font-mono uppercase">
            Merge Conflict Predictor
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            Know where your merge will break before you merge.
          </p>
        </div>

        <div className="w-full space-y-8 flex flex-col items-center">
          
          {/* Provider Toggle */}
          <div className="flex w-full max-w-md border border-border p-1 bg-secondary/20">
            <button
              onClick={() => { setProvider("local"); setError(""); }}
              className={`flex-1 py-2 text-xs font-mono tracking-widest uppercase transition-all ${provider === "local" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              Local Repo Path
            </button>
            <button
              onClick={() => { setProvider("github"); setError(""); }}
              className={`flex-1 py-2 text-xs font-mono tracking-widest uppercase transition-all ${provider === "github" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              GitHub Repo
            </button>
          </div>

          <form onSubmit={handleAnalyze} className="w-full max-w-md space-y-4">
            <AnimatePresence mode="wait">
              {provider === "local" ? (
                <motion.div key="local" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      id="repo"
                      type="text"
                      value={repoPath}
                      onChange={(e) => setRepoPath(e.target.value)}
                      placeholder="Repository path (e.g. C:\Projects\app)"
                      className="block w-full pl-11 pr-4 py-3 bg-secondary/30 border border-border rounded-none focus:ring-1 focus:ring-foreground focus:border-foreground transition-all outline-none text-foreground text-sm font-mono placeholder:text-muted-foreground/50"
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="github" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      placeholder="owner/repo (e.g. facebook/react)"
                      className="block w-full pl-11 pr-4 py-3 bg-secondary/30 border border-border rounded-none focus:ring-1 focus:ring-foreground focus:border-foreground transition-all outline-none text-foreground text-sm font-mono placeholder:text-muted-foreground/50"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="GitHub Token (optional, for private repos)"
                      className="block w-full pl-11 pr-4 py-3 bg-secondary/30 border border-border rounded-none focus:ring-1 focus:ring-foreground focus:border-foreground transition-all outline-none text-foreground text-sm font-mono placeholder:text-muted-foreground/50"
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex justify-between items-center h-5">
              {error ? (
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-xs text-destructive"
                >
                  {error}
                </motion.span>
              ) : <span />}
            </div>

            <button
              type="submit"
              disabled={(provider === "local" ? !repoPath : !githubRepo) || isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 py-3 rounded-none text-sm font-medium transition-all"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  <span>ANALYZING</span>
                </span>
              ) : (
                <span>ANALYZE REPOSITORY</span>
              )}
            </button>
          </form>

          <div className="flex items-center w-full max-w-md">
            <div className="flex-1 h-[1px] bg-border" />
            <span className="px-4 text-xs text-muted-foreground uppercase tracking-widest font-mono">or</span>
            <div className="flex-1 h-[1px] bg-border" />
          </div>

          <button 
            onClick={handleDemo}
            className="w-full max-w-md flex items-center justify-center space-x-2 bg-transparent text-foreground border border-border hover:border-foreground/50 py-3 rounded-none text-sm font-medium transition-all"
          >
            <span>TRY DEMO</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
