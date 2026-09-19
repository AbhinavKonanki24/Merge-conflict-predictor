import { DiffSource } from "../predictor";
export declare class LocalGitSource implements DiffSource {
    private repoPath;
    constructor(repoPath: string);
    getDivergence(baseBranch: string, compareBranch: string): Promise<{
        uniqueToA: number;
        uniqueToB: number;
    }>;
    getChangedFiles(baseBranch: string, compareBranch: string): Promise<string[]>;
    getDiff(baseBranch: string, compareBranch: string, file: string): Promise<string>;
    getFileCommitHistory(branch: string, file: string, maxCount: number): Promise<any[]>;
    getFileContent(branch: string, file: string): Promise<string>;
}
