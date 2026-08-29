import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!provider || !owner || !repo) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  if (provider === "github") {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/branches`;
      const headers: Record<string, string> = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "MCP-App"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`GitHub API Error: ${res.status}`);
      
      const data = await res.json();
      const branches = data.map((b: any) => b.name);
      
      // Try to find default branch
      const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const repoRes = await fetch(repoUrl, { headers });
      let current = "main";
      if (repoRes.ok) {
        const repoData = await repoRes.json();
        current = repoData.default_branch || "main";
      }

      return NextResponse.json({ current, branches });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
}
