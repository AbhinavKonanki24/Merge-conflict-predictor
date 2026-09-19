export interface DiffSource {
    getDivergence(baseBranch: string, compareBranch: string): Promise<{
        uniqueToA: number;
        uniqueToB: number;
    }>;
    getChangedFiles(baseBranch: string, compareBranch: string): Promise<string[]>;
    getDiff(baseBranch: string, compareBranch: string, file: string): Promise<string>;
    getFileCommitHistory(branch: string, file: string, maxCount: number): Promise<any[]>;
    getFileContent(branch: string, file: string): Promise<string>;
}
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export interface FileRisk {
    file: string;
    score: number;
    level: RiskLevel;
    reasons: string[];
    overlappingLines: {
        start: number;
        end: number;
    }[];
    baseLinesChanged: {
        start: number;
        end: number;
    }[];
    compareLinesChanged: {
        start: number;
        end: number;
    }[];
    commitFrequency: number;
    divergence: {
        uniqueToA: number;
        uniqueToB: number;
    };
}
export interface PredictionResult {
    overallScore: number;
    overallLevel: RiskLevel;
    files: FileRisk[];
    totalCommitsAnalyzed: number;
    sharedContributors: number;
    divergence: {
        uniqueToA: number;
        uniqueToB: number;
    };
}
export declare function parseDiffLines(diff: string): {
    start: number;
    end: number;
}[];
export declare function getOverlap(rangeA: {
    start: number;
    end: number;
}[], rangeB: {
    start: number;
    end: number;
}[]): {
    start: number;
    end: number;
}[];
export declare function getNearby(rangeA: {
    start: number;
    end: number;
}[], rangeB: {
    start: number;
    end: number;
}[], distance?: number): boolean;
export declare function classifyRisk(score: number): RiskLevel;
export declare function getStructuralRisk(file: string): number;
export declare function analyzeMergeRisk(source: DiffSource, baseBranch: string, compareBranch: string): Promise<PredictionResult>;
