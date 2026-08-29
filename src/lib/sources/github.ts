import { DiffSource } from "../predictor";

export class GitHubSource implements DiffSource {
  private owner: string;
  private repo: string;
  private token?: string;
  private compareCache: Map<string, any> = new Map();

  constructor(owner: string, repo: string, token?: string) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
  }

  private async fetchApi(path: string) {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}${path}`;
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "MCP-App"
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`GitHub API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  private async getCompare(base: string, compare: string) {
    const key = `${base}...${compare}`;
    if (!this.compareCache.has(key)) {
      const data = await this.fetchApi(`/compare/${base}...${compare}`);
      this.compareCache.set(key, data);
    }
    return this.compareCache.get(key);
  }

  async getDivergence(baseBranch: string, compareBranch: string) {
    const data = await this.getCompare(baseBranch, compareBranch);
    return {
      uniqueToA: data.behind_by || 0,
      uniqueToB: data.ahead_by || 0
    };
  }

  async getChangedFiles(baseBranch: string, compareBranch: string) {
    const data = await this.getCompare(baseBranch, compareBranch);
    return (data.files || []).map((f: any) => f.filename);
  }

  async getDiff(baseBranch: string, compareBranch: string, file: string) {
    const data = await this.getCompare(baseBranch, compareBranch);
    const fileData = (data.files || []).find((f: any) => f.filename === file);
    return fileData?.patch || "";
  }

  async getFileCommitHistory(branch: string, file: string, maxCount: number) {
    try {
      const data = await this.fetchApi(`/commits?sha=${encodeURIComponent(branch)}&path=${encodeURIComponent(file)}&per_page=${maxCount}`);
      return data.map((c: any) => ({
        hash: c.sha,
        author: c.commit.author.name,
        date: c.commit.author.date,
        message: c.commit.message
      }));
    } catch {
      return [];
    }
  }

  async getFileContent(branch: string, file: string) {
    try {
      const data = await this.fetchApi(`/contents/${encodeURIComponent(file)}?ref=${encodeURIComponent(branch)}`);
      if (data.encoding === "base64" && data.content) {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      return "";
    } catch {
      return "";
    }
  }
}
