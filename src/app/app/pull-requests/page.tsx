import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import { GitHubRepositoryService } from "@/lib/github";
import Link from "next/link";
import { GitPullRequest, GitMerge, AlertCircle, Clock } from "lucide-react";

export default async function PullRequestsPage({ searchParams }: { searchParams: { repo?: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  const { repo } = searchParams;

  if (!repo) {
    redirect("/app/repositories");
  }

  const accessToken = (session as any).accessToken;

  if (!accessToken) {
    return <div>No GitHub token found. Please sign in again.</div>;
  }

  const [owner, name] = repo.split("/");
  
  if (!owner || !name) {
    return <div>Invalid repository format. Must be owner/name.</div>;
  }

  const githubService = new GitHubRepositoryService(accessToken);
  let pullRequests: any[] = [];
  
  try {
    pullRequests = await githubService.getPullRequests(owner, name, "open");
  } catch (e) {
    console.error(e);
    return <div>Error fetching pull requests from GitHub.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative z-10">
      <div className="mb-8 border-b border-border pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-mono uppercase font-bold tracking-tight">Pull Requests</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            {repo}
          </p>
        </div>
        <Link href="/app/repositories" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          &larr; Back to Repositories
        </Link>
      </div>

      {pullRequests.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-sm">
          <GitPullRequest className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-mono mb-2">No open pull requests</h3>
          <p className="text-sm text-muted-foreground">There are currently no open pull requests in this repository.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pullRequests.map((pr) => (
            <div key={pr.id} className="border border-border p-5 rounded-sm hover:border-foreground transition-all bg-background">
              <div className="flex justify-between items-start">
                <div className="flex space-x-4">
                  <div className="mt-1 text-high">
                    <GitPullRequest className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">{pr.title} <span className="text-muted-foreground font-mono text-sm">#{pr.number}</span></h3>
                    <p className="text-sm text-muted-foreground font-mono flex items-center space-x-2">
                      <span>opened by {pr.user?.login}</span>
                    </p>
                    <div className="mt-4 flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-xs font-mono bg-muted px-2 py-1 rounded-sm">
                        <GitMerge className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{pr.base.ref} &larr; {pr.head.ref}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Link 
                  href={`/app?repo=${encodeURIComponent(repo)}&tab=overview&base=${encodeURIComponent(pr.base.ref)}&compare=${encodeURIComponent(pr.head.ref)}`}
                  className="bg-foreground text-background px-4 py-2 text-xs font-medium hover:bg-foreground/90 transition-colors uppercase tracking-widest whitespace-nowrap"
                >
                  Analyze Risk
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
