import { NextResponse } from "next/server";
import { analyzeMergeRisk } from "@fidesa/mcp-engine";
import { GitHubSource } from "@fidesa/mcp-engine";
import { db } from "@/lib/database/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await db.account.findFirst({
      where: {
        userId: (session.user as any).id,
        provider: "github",
      },
    });

    if (!account || !account.access_token) {
      return NextResponse.json({ error: "No GitHub token found" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, owner, repo, baseBranch, compareBranch } = body;

    if (!provider || !owner || !repo || !baseBranch || !compareBranch) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (provider === "github") {
      const source = new GitHubSource(owner, repo, account.access_token);
      const result = await analyzeMergeRisk(source, baseBranch, compareBranch);
      
      // Save analysis to database using Prisma
      // First, ensure repository exists in our DB
      let repository = await db.repository.findUnique({
        where: { fullName: `${owner}/${repo}` }
      });

      if (!repository) {
        // Create repository placeholder if it doesn't exist (assuming user's token has access)
        repository = await db.repository.create({
          data: {
            githubId: Math.floor(Math.random() * 1000000), // Placeholder, ideally fetch real githubId
            owner,
            name: repo,
            fullName: `${owner}/${repo}`,
            defaultBranch: "main"
          }
        });
      }

      await db.analysis.create({
        data: {
          repositoryId: repository.id,
          riskScore: result.overallScore,
          riskLevel: result.overallLevel,
          conflictCount: result.files.reduce((acc: number, f: any) => acc + (f.conflicts?.length || 0), 0),
          status: "COMPLETED",
          startedAt: new Date(),
          completedAt: new Date(),
          findings: {
            create: result.files.flatMap((f: any) => 
              (f.conflicts || []).map((c: any) => ({
                filePath: f.filePath,
                conflictType: c.type || "UNKNOWN",
                severity: f.riskLevel || "MEDIUM",
                lineStart: c.lines?.[0],
                lineEnd: c.lines?.[1],
                explanation: c.description || null,
              }))
            )
          }
        }
      });

      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
