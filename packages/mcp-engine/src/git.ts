import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

export class GitError extends Error {
  constructor(message: string, public stderr: string) {
    super(message);
    this.name = "GitError";
  }
}

export function validateBranchName(branch: string) {
  // basic check against shell metacharacters and basic git ref rules
  if (!/^[a-zA-Z0-9_\-\.\/]+$/.test(branch) || branch.includes("..") || branch.startsWith("-")) {
    throw new Error(`Invalid branch name: ${branch}`);
  }
}

async function runGitCommand(args: string[], repoPath: string): Promise<string> {
  if (!path.isAbsolute(repoPath)) {
    throw new Error("Repo path must be absolute");
  }
  
  if (repoPath.includes("..")) {
    throw new Error("Repo path cannot contain '..'");
  }

  const resolvedPath = path.resolve(repoPath);
  
  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
    throw new Error("Repo path is not a valid directory");
  }

  try {
    const { stdout, stderr } = await execFileAsync("git", args, { cwd: resolvedPath, maxBuffer: 1024 * 1024 * 5 });
    return stdout.trim();
  } catch (error: any) {
    throw new GitError(`Command failed: git ${args.join(" ")}`, error.stderr || error.message);
  }
}

export async function isGitRepo(repoPath: string): Promise<boolean> {
  try {
    const result = await runGitCommand(["rev-parse", "--is-inside-work-tree"], repoPath);
    return result === "true";
  } catch {
    return false;
  }
}

export async function getBranches(repoPath: string): Promise<{ current: string; branches: string[] }> {
  const stdout = await runGitCommand(["branch", "--all"], repoPath);
  const lines = stdout.split("\n").map(l => l.trim()).filter(Boolean);
  
  let current = "";
  const branches = new Set<string>();

  for (const line of lines) {
    if (line.startsWith("* ")) {
      current = line.replace("* ", "");
      branches.add(current);
    } else if (!line.includes("->")) {
      const cleanBranch = line.replace("remotes/origin/", "").replace("remotes/upstream/", "");
      branches.add(cleanBranch);
    }
  }

  return { current, branches: Array.from(branches) };
}

export async function getMergeBase(repoPath: string, branchA: string, branchB: string): Promise<string> {
  validateBranchName(branchA);
  validateBranchName(branchB);
  return runGitCommand(["merge-base", branchA, branchB], repoPath);
}

export async function getChangedFiles(repoPath: string, baseRef: string, compareRef: string): Promise<string[]> {
  validateBranchName(baseRef);
  validateBranchName(compareRef);
  const stdout = await runGitCommand(["diff", "--name-only", `${baseRef}...${compareRef}`, "--"], repoPath);
  return stdout.split("\n").map(l => l.trim()).filter(Boolean);
}

export async function getDiff(repoPath: string, baseRef: string, compareRef: string, file: string): Promise<string> {
  validateBranchName(baseRef);
  validateBranchName(compareRef);
  try {
    return await runGitCommand(["diff", "--unified=0", `${baseRef}...${compareRef}`, "--", file], repoPath);
  } catch {
    return ""; // File might be new, deleted, or binary
  }
}

export async function getCommitHistory(repoPath: string, branch: string, maxCount: number = 20): Promise<any[]> {
  validateBranchName(branch);
  const format = "%H|%an|%ad|%s";
  const stdout = await runGitCommand(["log", `-n`, `${maxCount}`, `--format=${format}`, "--date=short", branch, "--"], repoPath);
  
  return stdout.split("\n").map(l => l.trim()).filter(Boolean).map(line => {
    const [hash, author, date, message] = line.split("|");
    return { hash, author, date, message };
  });
}

export async function getFileCommitHistory(repoPath: string, branch: string, file: string, maxCount: number = 20): Promise<any[]> {
  validateBranchName(branch);
  const format = "%H|%an|%ad|%s";
  try {
    const stdout = await runGitCommand(["log", `-n`, `${maxCount}`, `--format=${format}`, "--date=short", branch, "--", file], repoPath);
    return stdout.split("\n").map(l => l.trim()).filter(Boolean).map(line => {
      const [hash, author, date, message] = line.split("|");
      return { hash, author, date, message };
    });
  } catch {
    return [];
  }
}

export async function getDivergence(repoPath: string, branchA: string, branchB: string): Promise<{ uniqueToA: number, uniqueToB: number }> {
  validateBranchName(branchA);
  validateBranchName(branchB);
  try {
    const stdoutA = await runGitCommand(["rev-list", "--count", `${branchB}..${branchA}`, "--"], repoPath);
    const stdoutB = await runGitCommand(["rev-list", "--count", `${branchA}..${branchB}`, "--"], repoPath);
    
    return {
      uniqueToA: parseInt(stdoutA, 10) || 0,
      uniqueToB: parseInt(stdoutB, 10) || 0
    };
  } catch {
    return { uniqueToA: 0, uniqueToB: 0 };
  }
}

export async function getFileContent(repoPath: string, ref: string, file: string): Promise<string> {
  validateBranchName(ref);
  try {
    return await runGitCommand(["show", `${ref}:${file}`], repoPath);
  } catch {
    return "";
  }
}
