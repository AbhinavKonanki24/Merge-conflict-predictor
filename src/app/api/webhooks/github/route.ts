import { NextResponse } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import { db } from "@/lib/database/db";
import { GitHubRepositoryService } from "@/lib/github";
import { GitHubSource, analyzeMergeRisk } from "@fidesa/mcp-engine";

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET || "development-secret",
});

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-hub-signature-256") || "";
    const id = request.headers.get("x-github-delivery") || "";
    const name = request.headers.get("x-github-event") || "";
    const payloadString = await request.text();

    const verified = await webhooks.verify(payloadString, signature);
    if (!verified) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(payloadString);

    const existingEvent = await db.webhookEvent.findUnique({
      where: { githubDeliveryId: id }
    });

    if (existingEvent) {
      console.log(`Webhook ${id} already processed`);
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    await db.webhookEvent.create({
      data: {
        githubDeliveryId: id,
        eventType: name,
        status: "RECEIVED",
      }
    });

    if (name === "pull_request" && (payload.action === "opened" || payload.action === "synchronize")) {
      processPullRequest(payload, id).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processPullRequest(payload: any, deliveryId: string) {
  const pr = payload.pull_request;
  const repo = payload.repository;
  const installationId = payload.installation?.id;

  if (!installationId) {
    console.log("Ignored PR without installation ID");
    return;
  }

  try {
    const appService = new GitHubRepositoryService(undefined, installationId);
    const token = await appService.getInstallationToken(installationId);
    const githubService = new GitHubRepositoryService(token);
    
    const check = await githubService.createCheckRun(
      repo.owner.login,
      repo.name,
      pr.head.sha,
      "Merge Conflict Predictor"
    );

    const mcpSource = new GitHubSource(repo.owner.login, repo.name, token);
    const result = await analyzeMergeRisk(mcpSource, pr.base.ref, pr.head.ref);

    const isRisky = result.overallLevel === "Critical" || result.overallLevel === "High";
    const conclusion = isRisky ? "failure" : "success";

    const title = `Merge Risk: ${result.overallLevel} (${result.overallScore}/100)`;
    const summary = `We detected ${result.files.reduce((a: any, b: any) => a + (b.conflicts?.length || 0), 0)} potential conflicts across ${result.files.length} changed files.`;

    let repository = await db.repository.findUnique({
      where: { fullName: `${repo.owner.login}/${repo.name}` }
    });

    if (!repository) {
      repository = await db.repository.create({
        data: {
          githubId: repo.id,
          owner: repo.owner.login,
          name: repo.name,
          fullName: `${repo.owner.login}/${repo.name}`,
          defaultBranch: repo.default_branch || "main",
          installationId: installationId.toString()
        }
      });
    }

    let pullRequest = await db.pullRequest.findUnique({
      where: {
        repositoryId_number: {
          repositoryId: repository.id,
          number: pr.number
        }
      }
    });

    if (!pullRequest) {
      pullRequest = await db.pullRequest.create({
        data: {
          githubId: pr.id,
          number: pr.number,
          title: pr.title,
          sourceBranch: pr.head.ref,
          targetBranch: pr.base.ref,
          author: pr.user?.login,
          repositoryId: repository.id,
        }
      });
    }

    await db.analysis.create({
      data: {
        repositoryId: repository.id,
        pullRequestId: pullRequest.id,
        commitSha: pr.head.sha,
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

    await githubService.updateCheckRun(
      repo.owner.login,
      repo.name,
      check.id,
      "completed",
      conclusion,
      { title, summary }
    );

    // Phase 16: Post PR Comment
    let prComment = `🤖 **MCP — Merge Conflict Predictor**\n\n**Merge Risk:** ${result.overallLevel} — ${result.overallScore}%\n\nMCP detected ${result.files.reduce((a: any, b: any) => a + (b.conflicts?.length || 0), 0)} potential conflict zones.\n\n`;
    
    result.files.slice(0, 10).forEach((file: any) => {
      const icon = file.riskLevel === "Critical" || file.riskLevel === "High" ? "🔴" : file.riskLevel === "Medium" ? "🟠" : "🟢";
      prComment += `${icon} **${file.riskLevel} Risk**\n\`${file.filePath}\`\n*${file.riskScore} risk points*\n\n`;
    });

    if (result.files.length > 10) {
      prComment += `\n...and ${result.files.length - 10} more files.\n`;
    }

    prComment += `\n[View detailed analysis in MCP Dashboard](https://fidesa.com/app/pull-requests?repo=${repo.owner.login}/${repo.name})`;

    await githubService.createPullRequestComment(repo.owner.login, repo.name, pr.number, prComment);

    await db.webhookEvent.update({
      where: { githubDeliveryId: deliveryId },
      data: { status: "PROCESSED", processedAt: new Date() }
    });

  } catch (error) {
    console.error("PR processing failed", error);
    await db.webhookEvent.update({
      where: { githubDeliveryId: deliveryId },
      data: { status: "FAILED" }
    });
  }
}
