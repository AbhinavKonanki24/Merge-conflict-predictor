import { NextResponse } from "next/server";
import { isGitRepo } from "@/lib/git";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoPath = searchParams.get("path");

  if (!repoPath) {
    return NextResponse.json({ error: "Missing repo path" }, { status: 400 });
  }

  const valid = await isGitRepo(repoPath);
  return NextResponse.json({ valid });
}
