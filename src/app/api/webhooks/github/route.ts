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
    // For OAuth apps, we need a way to map this webhook back to a specific user's access_token.
    // Since this MVP currently doesn't store user<->repo mappings, we cannot authenticate the webhook.
    // In a production app, you would look up the user who enabled this repo and use their token.
    console.log(`Webhook received for ${repo.owner.login}/${repo.name}, but OAuth token mapping is not implemented.`);
    return;
    
    // The rest of this function would execute if we had a valid user token:
    /*
    const githubService = new GitHubRepositoryService(token);
    
    const check = await githubService.createCheckRun(
      repo.owner.login,
      repo.name,
      pr.head.sha,
      "Merge Conflict Predictor"
    );

    const mcpSource = new GitHubSource(repo.owner.login, repo.name, token);
    const result = await analyzeMergeRisk(mcpSource, pr.base.ref, pr.head.ref);
    */

    // This MVP does not map OAuth tokens to Webhook events.
    // The previous implementation was built for GitHub Apps and used Installation Tokens,
    // which are incompatible with your current OAuth setup.
    // To support automated webhooks, we need a mechanism to query the `Account` table
    // for a valid user access_token that has permissions to this repository.

  } catch (error) {
    console.error("PR processing failed", error);
    await db.webhookEvent.update({
      where: { githubDeliveryId: deliveryId },
      data: { status: "FAILED" }
    });
  }
}
