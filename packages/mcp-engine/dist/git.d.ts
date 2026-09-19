export declare class GitError extends Error {
    stderr: string;
    constructor(message: string, stderr: string);
}
export declare function validateBranchName(branch: string): void;
export declare function isGitRepo(repoPath: string): Promise<boolean>;
export declare function getBranches(repoPath: string): Promise<{
    current: string;
    branches: string[];
}>;
export declare function getMergeBase(repoPath: string, branchA: string, branchB: string): Promise<string>;
export declare function getChangedFiles(repoPath: string, baseRef: string, compareRef: string): Promise<string[]>;
export declare function getDiff(repoPath: string, baseRef: string, compareRef: string, file: string): Promise<string>;
export declare function getCommitHistory(repoPath: string, branch: string, maxCount?: number): Promise<any[]>;
export declare function getFileCommitHistory(repoPath: string, branch: string, file: string, maxCount?: number): Promise<any[]>;
export declare function getDivergence(repoPath: string, branchA: string, branchB: string): Promise<{
    uniqueToA: number;
    uniqueToB: number;
}>;
export declare function getFileContent(repoPath: string, ref: string, file: string): Promise<string>;
