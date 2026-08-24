import { NextResponse } from "next/server";
import { analyzeMergeRisk } from "@/lib/predictor";
import { isGitRepo } from "@/lib/git";

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

    const result = await analyzeMergeRisk(repoPath, baseBranch, compareBranch);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
