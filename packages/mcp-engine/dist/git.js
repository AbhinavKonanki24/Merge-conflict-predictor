"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitError = void 0;
exports.validateBranchName = validateBranchName;
exports.isGitRepo = isGitRepo;
exports.getBranches = getBranches;
exports.getMergeBase = getMergeBase;
exports.getChangedFiles = getChangedFiles;
exports.getDiff = getDiff;
exports.getCommitHistory = getCommitHistory;
exports.getFileCommitHistory = getFileCommitHistory;
exports.getDivergence = getDivergence;
exports.getFileContent = getFileContent;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
class GitError extends Error {
    stderr;
    constructor(message, stderr) {
        super(message);
        this.stderr = stderr;
        this.name = "GitError";
    }
}
exports.GitError = GitError;
function validateBranchName(branch) {
    // basic check against shell metacharacters and basic git ref rules
    if (!/^[a-zA-Z0-9_\-\.\/]+$/.test(branch) || branch.includes("..") || branch.startsWith("-")) {
        throw new Error(`Invalid branch name: ${branch}`);
    }
}
async function runGitCommand(args, repoPath) {
    if (!path_1.default.isAbsolute(repoPath)) {
        throw new Error("Repo path must be absolute");
    }
    if (repoPath.includes("..")) {
        throw new Error("Repo path cannot contain '..'");
    }
    const resolvedPath = path_1.default.resolve(repoPath);
    if (!fs_1.default.existsSync(resolvedPath) || !fs_1.default.statSync(resolvedPath).isDirectory()) {
        throw new Error("Repo path is not a valid directory");
    }
    try {
        const { stdout, stderr } = await execFileAsync("git", args, { cwd: resolvedPath, maxBuffer: 1024 * 1024 * 5 });
        return stdout.trim();
    }
    catch (error) {
        throw new GitError(`Command failed: git ${args.join(" ")}`, error.stderr || error.message);
    }
}
async function isGitRepo(repoPath) {
    try {
        const result = await runGitCommand(["rev-parse", "--is-inside-work-tree"], repoPath);
        return result === "true";
    }
    catch {
        return false;
    }
}
async function getBranches(repoPath) {
    const stdout = await runGitCommand(["branch", "--all"], repoPath);
    const lines = stdout.split("\n").map(l => l.trim()).filter(Boolean);
    let current = "";
    const branches = new Set();
    for (const line of lines) {
        if (line.startsWith("* ")) {
            current = line.replace("* ", "");
            branches.add(current);
        }
        else if (!line.includes("->")) {
            const cleanBranch = line.replace("remotes/origin/", "").replace("remotes/upstream/", "");
            branches.add(cleanBranch);
        }
    }
    return { current, branches: Array.from(branches) };
}
async function getMergeBase(repoPath, branchA, branchB) {
    validateBranchName(branchA);
    validateBranchName(branchB);
    return runGitCommand(["merge-base", branchA, branchB], repoPath);
}
async function getChangedFiles(repoPath, baseRef, compareRef) {
    validateBranchName(baseRef);
    validateBranchName(compareRef);
    const stdout = await runGitCommand(["diff", "--name-only", `${baseRef}...${compareRef}`, "--"], repoPath);
    return stdout.split("\n").map(l => l.trim()).filter(Boolean);
}
async function getDiff(repoPath, baseRef, compareRef, file) {
    validateBranchName(baseRef);
    validateBranchName(compareRef);
    try {
        return await runGitCommand(["diff", "--unified=0", `${baseRef}...${compareRef}`, "--", file], repoPath);
    }
    catch {
        return ""; // File might be new, deleted, or binary
    }
}
async function getCommitHistory(repoPath, branch, maxCount = 20) {
    validateBranchName(branch);
    const format = "%H|%an|%ad|%s";
    const stdout = await runGitCommand(["log", `-n`, `${maxCount}`, `--format=${format}`, "--date=short", branch, "--"], repoPath);
    return stdout.split("\n").map(l => l.trim()).filter(Boolean).map(line => {
        const [hash, author, date, message] = line.split("|");
        return { hash, author, date, message };
    });
}
async function getFileCommitHistory(repoPath, branch, file, maxCount = 20) {
    validateBranchName(branch);
    const format = "%H|%an|%ad|%s";
    try {
        const stdout = await runGitCommand(["log", `-n`, `${maxCount}`, `--format=${format}`, "--date=short", branch, "--", file], repoPath);
        return stdout.split("\n").map(l => l.trim()).filter(Boolean).map(line => {
            const [hash, author, date, message] = line.split("|");
            return { hash, author, date, message };
        });
    }
    catch {
        return [];
    }
}
async function getDivergence(repoPath, branchA, branchB) {
    validateBranchName(branchA);
    validateBranchName(branchB);
    try {
        const stdoutA = await runGitCommand(["rev-list", "--count", `${branchB}..${branchA}`, "--"], repoPath);
        const stdoutB = await runGitCommand(["rev-list", "--count", `${branchA}..${branchB}`, "--"], repoPath);
        return {
            uniqueToA: parseInt(stdoutA, 10) || 0,
            uniqueToB: parseInt(stdoutB, 10) || 0
        };
    }
    catch {
        return { uniqueToA: 0, uniqueToB: 0 };
    }
}
async function getFileContent(repoPath, ref, file) {
    validateBranchName(ref);
    try {
        return await runGitCommand(["show", `${ref}:${file}`], repoPath);
    }
    catch {
        return "";
    }
}
