import { NextResponse } from "next/server";
import { analyzeMergeRisk } from "@/lib/predictor";
import { isGitRepo } from "@/lib/git";
import { LocalGitSource } from "@/lib/sources/local";
import { saveAnalysis } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repoPath, baseBranch, compareBranch } = body;

    if (!repoPath || !baseBranch || !compareBranch) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const valid = await isGitRepo(repoPath);
    if (!valid) {
      return NextResponse.json({ error: "Invalid Git repository" }, { status: 400 });
    }

    const source = new LocalGitSource(repoPath);
    const result = await analyzeMergeRisk(source, baseBranch, compareBranch);
    
    saveAnalysis({
      repo: repoPath,
      provider: "local",
      baseBranch,
      compareBranch,
      overallScore: result.overallScore,
      overallLevel: result.overallLevel
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
