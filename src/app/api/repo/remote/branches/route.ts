import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { db } from "@/lib/database/db";
import { GitHubRepositoryService } from "@/lib/github";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!provider || !owner || !repo) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: "No GitHub token found" }, { status: 401 });
  }

  if (provider === "github") {
    try {
      const githubService = new GitHubRepositoryService(accessToken);
      
      const [branches, repoData] = await Promise.all([
        githubService.getBranches(owner, repo),
        githubService.getRepository(owner, repo)
      ]);

      const current = repoData.default_branch || "main";

      return NextResponse.json({ current, branches });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
}
