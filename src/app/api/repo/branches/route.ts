import { NextResponse } from "next/server";
import { getBranches, isGitRepo } from "@/lib/git";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoPath = searchParams.get("path");

  if (!repoPath) {
    return NextResponse.json({ error: "Missing repo path" }, { status: 400 });
  }

  const valid = await isGitRepo(repoPath);
  if (!valid) {
    return NextResponse.json({ error: "Invalid Git repository" }, { status: 400 });
  }

  try {
    const branches = await getBranches(repoPath);
    return NextResponse.json(branches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
