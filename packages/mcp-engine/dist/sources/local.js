"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalGitSource = void 0;
const git_1 = require("../git");
class LocalGitSource {
    repoPath;
    constructor(repoPath) {
        this.repoPath = repoPath;
    }
    async getDivergence(baseBranch, compareBranch) {
        return (0, git_1.getDivergence)(this.repoPath, baseBranch, compareBranch);
    }
    async getChangedFiles(baseBranch, compareBranch) {
        return (0, git_1.getChangedFiles)(this.repoPath, baseBranch, compareBranch);
    }
    async getDiff(baseBranch, compareBranch, file) {
        return (0, git_1.getDiff)(this.repoPath, baseBranch, compareBranch, file);
    }
    async getFileCommitHistory(branch, file, maxCount) {
        return (0, git_1.getFileCommitHistory)(this.repoPath, branch, file, maxCount);
    }
    async getFileContent(branch, file) {
        return (0, git_1.getFileContent)(this.repoPath, branch, file);
    }
}
exports.LocalGitSource = LocalGitSource;
