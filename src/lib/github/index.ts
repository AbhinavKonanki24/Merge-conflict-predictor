import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";

export class GitHubRepositoryService {
  private octokit: Octokit;

  constructor(token?: string, installationId?: number) {
    if (installationId) {
      // Authenticate as a GitHub App Installation
      this.octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: process.env.GITHUB_APP_ID!,
          privateKey: process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          installationId: installationId,
        },
      });
    } else if (token) {
      // Authenticate as a User via OAuth Token
      this.octokit = new Octokit({
        auth: token,
      });
    } else {
      // Unauthenticated (will hit rate limits quickly)
      this.octokit = new Octokit();
    }
  }

  async listUserRepositories() {
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });
    return data;
  }

  async getRepository(owner: string, repo: string) {
    const { data } = await this.octokit.rest.repos.get({
      owner,
      repo,
    });
    return data;
  }

  async getBranches(owner: string, repo: string) {
    const { data } = await this.octokit.rest.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });
    return data.map((b) => b.name);
  }

  async getPullRequests(owner: string, repo: string, state: "open" | "closed" | "all" = "open") {
    const { data } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state,
      sort: "updated",
      direction: "desc",
      per_page: 100,
    });
    return data;
  }

  async getPullRequest(owner: string, repo: string, pullNumber: number) {
    const { data } = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return data;
  }

  async createPullRequestComment(owner: string, repo: string, issueNumber: number, body: string) {
    const { data } = await this.octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
    return data;
  }

  async createCheckRun(owner: string, repo: string, sha: string, name: string) {
    const { data } = await this.octokit.rest.checks.create({
      owner,
      repo,
      name,
      head_sha: sha,
      status: "in_progress",
      started_at: new Date().toISOString(),
    });
    return data;
  }

  async updateCheckRun(owner: string, repo: string, checkRunId: number, status: string, conclusion: string, output: any) {
    const { data } = await this.octokit.rest.checks.update({
      owner,
      repo,
      check_run_id: checkRunId,
      status: status as any,
      conclusion: conclusion as any,
      completed_at: new Date().toISOString(),
      output,
    });
    return data;
  }

  async getInstallationToken(installationId: number) {
    const { data } = await this.octokit.rest.apps.createInstallationAccessToken({
      installation_id: installationId,
    });
    return data.token;
  }
}
