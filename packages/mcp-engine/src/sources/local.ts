import { DiffSource } from "../predictor";
import { getChangedFiles, getDiff, getFileCommitHistory, getDivergence, getFileContent } from "../git";

export class LocalGitSource implements DiffSource {
  constructor(private repoPath: string) {}

  async getDivergence(baseBranch: string, compareBranch: string) {
    return getDivergence(this.repoPath, baseBranch, compareBranch);
  }

  async getChangedFiles(baseBranch: string, compareBranch: string) {
    return getChangedFiles(this.repoPath, baseBranch, compareBranch);
  }

  async getDiff(baseBranch: string, compareBranch: string, file: string) {
    return getDiff(this.repoPath, baseBranch, compareBranch, file);
  }

  async getFileCommitHistory(branch: string, file: string, maxCount: number) {
    return getFileCommitHistory(this.repoPath, branch, file, maxCount);
  }

  async getFileContent(branch: string, file: string) {
    return getFileContent(this.repoPath, branch, file);
  }
}
