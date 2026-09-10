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

  // Fetch the user's GitHub account token from Prisma
  const account = await db.account.findFirst({
    where: {
      userId: (session.user as any).id,
      provider: "github",
    },
  });

  if (!account || !account.access_token) {
    return <div>No GitHub token found. Please sign in again.</div>;
  }

  const githubService = new GitHubRepositoryService(account.access_token);
  let repositories: any[] = [];
  try {
    repositories = await githubService.listUserRepositories();
  } catch (e) {
    console.error(e);
    return <div>Error fetching repositories from GitHub.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative z-10">
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="text-2xl font-mono uppercase font-bold tracking-tight">Select a Repository</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Choose a repository to run merge conflict prediction
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repositories.map((repo) => (
          <Link href={`/app?repo=${encodeURIComponent(repo.full_name)}&tab=overview`} key={repo.id}>
            <div className="border border-border p-5 rounded-sm hover:border-foreground transition-all group bg-background relative overflow-hidden h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-mono text-sm font-bold truncate group-hover:text-primary transition-colors">
                  {repo.full_name}
                </h3>
                {repo.private && <Lock className="w-4 h-4 text-muted-foreground" />}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                {repo.description || "No description provided."}
              </p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground font-mono">
                <span className="flex items-center space-x-1">
                  <Star className="w-3 h-3" />
                  <span>{repo.stargazers_count}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <GitFork className="w-3 h-3" />
                  <span>{repo.forks_count}</span>
                </span>
                <span className="ml-auto flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-foreground/30"></span>
                  <span>{repo.language || "Unknown"}</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
