import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import { GitHubRepositoryService } from "@/lib/github";
import { motion } from "framer-motion";
import Link from "next/link";
import { GitFork, Star, Lock } from "lucide-react";

export default async function RepositoriesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  const accessToken = (session as any).accessToken;

  if (!accessToken) {
    return <div>No GitHub token found. Please sign in again.</div>;
  }

  const githubService = new GitHubRepositoryService(accessToken);
  let repositories: any[] = [];
  try {
    repositories = await githubService.listUserRepositories();
  } catch (e) {
    console.error(e);
    return <div>Error fetching repositories from GitHub.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative z-10">
      <div className="mb-12 border-b border-white/5 pb-6">
        <h1 className="text-3xl font-mono uppercase font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-muted-foreground inline-block text-glow">Select a Repository</h1>
        <p className="text-muted-foreground text-sm mt-2 font-sans">
          Choose a repository to predict and prevent merge conflicts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repositories.map((repo) => (
          <Link href={`/app?provider=github&owner=${encodeURIComponent(repo.owner.login)}&repo=${encodeURIComponent(repo.name)}&tab=overview`} key={repo.id}>
            <div className="glass-card p-6 rounded-2xl group relative overflow-hidden h-full flex flex-col cursor-pointer">
              {/* Hover Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="font-mono text-sm font-bold truncate group-hover:text-accent transition-colors duration-300 drop-shadow-md">
                  {repo.full_name}
                </h3>
                {repo.private && <Lock className="w-4 h-4 text-muted-foreground/50" />}
              </div>
              <p className="text-sm text-muted-foreground mb-6 flex-1 font-sans relative z-10">
                {repo.description || "No description provided."}
              </p>
              <div className="flex items-center space-x-5 text-xs text-muted-foreground font-mono relative z-10">
                <span className="flex items-center space-x-1.5 hover:text-foreground transition-colors">
                  <Star className="w-3.5 h-3.5" />
                  <span>{repo.stargazers_count}</span>
                </span>
                <span className="flex items-center space-x-1.5 hover:text-foreground transition-colors">
                  <GitFork className="w-3.5 h-3.5" />
                  <span>{repo.forks_count}</span>
                </span>
                <span className="ml-auto flex items-center space-x-2 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_5px_currentColor]"></span>
                  <span className="text-[10px] uppercase tracking-widest">{repo.language || "Unknown"}</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
