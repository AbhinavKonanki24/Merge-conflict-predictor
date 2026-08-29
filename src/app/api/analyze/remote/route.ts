import { NextResponse } from "next/server";
import { analyzeMergeRisk } from "@/lib/predictor";
import { GitHubSource } from "@/lib/sources/github";
import { saveAnalysis } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, owner, repo, baseBranch, compareBranch, token } = body;

    if (!provider || !owner || !repo || !baseBranch || !compareBranch) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (provider === "github") {
      const source = new GitHubSource(owner, repo, token);
      const result = await analyzeMergeRisk(source, baseBranch, compareBranch);
      
      saveAnalysis({
        repo: `${owner}/${repo}`,
        provider: "github",
        baseBranch,
        compareBranch,
        overallScore: result.overallScore,
        overallLevel: result.overallLevel
      });

      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
