import { NextResponse } from "next/server";
import { analyzeMergeRisk } from "@fidesa/mcp-engine";
import { isGitRepo } from "@fidesa/mcp-engine";
import { LocalGitSource } from "@fidesa/mcp-engine";

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

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
