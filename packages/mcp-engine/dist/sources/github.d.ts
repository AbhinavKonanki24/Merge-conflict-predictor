import { DiffSource } from "../predictor";
export declare class GitHubSource implements DiffSource {
    private owner;
    private repo;
    private token?;
    private compareCache;
    constructor(owner: string, repo: string, token?: string);
    private fetchApi;
    private getCompare;
    getDivergence(baseBranch: string, compareBranch: string): Promise<{
        uniqueToA: any;
        uniqueToB: any;
    }>;
    getChangedFiles(baseBranch: string, compareBranch: string): Promise<any>;
    getDiff(baseBranch: string, compareBranch: string, file: string): Promise<any>;
    getFileCommitHistory(branch: string, file: string, maxCount: number): Promise<any>;
    getFileContent(branch: string, file: string): Promise<string>;
}
