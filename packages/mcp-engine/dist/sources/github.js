"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubSource = void 0;
class GitHubSource {
    owner;
    repo;
    token;
    compareCache = new Map();
    constructor(owner, repo, token) {
        this.owner = owner;
        this.repo = repo;
        this.token = token;
    }
    async fetchApi(path) {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}${path}`;
        const headers = {
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
    async getCompare(base, compare) {
        const key = `${base}...${compare}`;
        if (!this.compareCache.has(key)) {
            const data = await this.fetchApi(`/compare/${base}...${compare}`);
            this.compareCache.set(key, data);
        }
        return this.compareCache.get(key);
    }
    async getDivergence(baseBranch, compareBranch) {
        const data = await this.getCompare(baseBranch, compareBranch);
        return {
            uniqueToA: data.behind_by || 0,
            uniqueToB: data.ahead_by || 0
        };
    }
    async getChangedFiles(baseBranch, compareBranch) {
        const data = await this.getCompare(baseBranch, compareBranch);
        return (data.files || []).map((f) => f.filename);
    }
    async getDiff(baseBranch, compareBranch, file) {
        const data = await this.getCompare(baseBranch, compareBranch);
        const fileData = (data.files || []).find((f) => f.filename === file);
        return fileData?.patch || "";
    }
    async getFileCommitHistory(branch, file, maxCount) {
        try {
            const data = await this.fetchApi(`/commits?sha=${encodeURIComponent(branch)}&path=${encodeURIComponent(file)}&per_page=${maxCount}`);
            return data.map((c) => ({
                hash: c.sha,
                author: c.commit.author.name,
                date: c.commit.author.date,
                message: c.commit.message
            }));
        }
        catch {
            return [];
        }
    }
    async getFileContent(branch, file) {
        try {
            const data = await this.fetchApi(`/contents/${encodeURIComponent(file)}?ref=${encodeURIComponent(branch)}`);
            if (data.encoding === "base64" && data.content) {
                return Buffer.from(data.content, "base64").toString("utf-8");
            }
            return "";
        }
        catch {
            return "";
        }
    }
}
exports.GitHubSource = GitHubSource;
