import { getEnclosingFunction } from "./ast";

export interface DiffSource {
  getDivergence(baseBranch: string, compareBranch: string): Promise<{ uniqueToA: number; uniqueToB: number }>;
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
  overlappingLines: { start: number; end: number }[];
  baseLinesChanged: { start: number; end: number }[];
  compareLinesChanged: { start: number; end: number }[];
  commitFrequency: number;
  divergence: { uniqueToA: number; uniqueToB: number };
}

export interface PredictionResult {
  overallScore: number;
  overallLevel: RiskLevel;
  files: FileRisk[];
  totalCommitsAnalyzed: number;
  sharedContributors: number;
  divergence: { uniqueToA: number; uniqueToB: number };
}

const RISK_WEIGHTS = {
  SAME_FILE: 10,
  LINE_OVERLAP: 32,
  FUNCTION_OVERLAP: 18, // Actually AST-aware now
  DIFFERENT_FUNCTION_OVERLAP: 10,
  COMMIT_FREQUENCY: 12,
  BRANCH_DIVERGENCE: 10,
  NEARBY_CHANGES: 6,
  CONTRIBUTOR_OVERLAP: 4,
  STRUCTURAL_SENSITIVITY: 8
};

export function parseDiffLines(diff: string): { start: number; end: number }[] {
  const changedLines: { start: number; end: number }[] = [];
  const lines = diff.split("\n");
  for (const line of lines) {
    // Format: @@ -144,0 +145,5 @@
    if (line.startsWith("@@ ")) {
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
      if (match) {
        const start = parseInt(match[1], 10);
        const count = match[2] ? parseInt(match[2], 10) : 1;
        if (count > 0) {
          changedLines.push({ start, end: start + count - 1 });
        }
      }
    }
  }
  return changedLines;
}

export function getOverlap(rangeA: { start: number; end: number }[], rangeB: { start: number; end: number }[]): { start: number; end: number }[] {
  const overlap: { start: number; end: number }[] = [];
  for (const a of rangeA) {
    for (const b of rangeB) {
      const start = Math.max(a.start, b.start);
      const end = Math.min(a.end, b.end);
      if (start <= end) {
        overlap.push({ start, end });
      }
    }
  }
  return overlap;
}

export function getNearby(rangeA: { start: number; end: number }[], rangeB: { start: number; end: number }[], distance: number = 5): boolean {
  for (const a of rangeA) {
    for (const b of rangeB) {
      if (Math.abs(a.start - b.end) <= distance || Math.abs(b.start - a.end) <= distance) {
        return true;
      }
    }
  }
  return false;
}

export function classifyRisk(score: number): RiskLevel {
  if (score < 40) return "Low";
  if (score < 60) return "Medium";
  if (score < 80) return "High";
  return "Critical";
}

export function getStructuralRisk(file: string): number {
  if (file.endsWith(".json") || file.endsWith(".yaml") || file.endsWith(".yml") || file.endsWith(".xml")) return RISK_WEIGHTS.STRUCTURAL_SENSITIVITY;
  if (file.includes("lock") || file.includes("manifest")) return RISK_WEIGHTS.STRUCTURAL_SENSITIVITY;
  return 0;
}

export async function analyzeMergeRisk(source: DiffSource, baseBranch: string, compareBranch: string): Promise<PredictionResult> {
  const divergence = await source.getDivergence(baseBranch, compareBranch);
  const changedFilesBase = await source.getChangedFiles(baseBranch, compareBranch);
  const changedFilesCompare = await source.getChangedFiles(compareBranch, baseBranch); // Wait, diff is from merge base

  // We need to compare both branches against the merge-base to see what each changed.
  // Actually, getChangedFiles(baseBranch...compareBranch) gets files changed in compareBranch relative to merge-base.
  // To get files changed in baseBranch relative to merge-base, we need `getChangedFiles(compareBranch...baseBranch)`.
  const baseChanged = await source.getChangedFiles(compareBranch, baseBranch);
  const compareChanged = await source.getChangedFiles(baseBranch, compareBranch);

  const sharedFiles = compareChanged.filter(f => baseChanged.includes(f));

  const fileRisks: FileRisk[] = [];
  let totalCommitsAnalyzed = 0;
  let sharedContributors = new Set<string>();

  for (const file of sharedFiles) {
    let score = RISK_WEIGHTS.SAME_FILE;
    const reasons: string[] = ["Same file modified in both branches"];

    const diffBase = await source.getDiff(compareBranch, baseBranch, file); // base branch diff against merge base
    const diffCompare = await source.getDiff(baseBranch, compareBranch, file); // compare branch diff against merge base

    const baseLines = parseDiffLines(diffBase);
    const compareLines = parseDiffLines(diffCompare);

    const overlappingLines = getOverlap(baseLines, compareLines);
    if (overlappingLines.length > 0) {
      score += RISK_WEIGHTS.LINE_OVERLAP;
      
      const baseFileContent = await source.getFileContent(baseBranch, file);
      const compareFileContent = await source.getFileContent(compareBranch, file);
      
      let sameFunctionFound = false;
      let differentFunctionFound = false;
      let resolvedFunctionName = "";
      let anyFunctionResolved = false;

      for (const overlap of overlappingLines) {
        const baseFunc = getEnclosingFunction(file, overlap.start, baseFileContent);
        const compareFunc = getEnclosingFunction(file, Math.max(overlap.start, overlap.end), compareFileContent); // check overlap start

        if (baseFunc && compareFunc) {
          anyFunctionResolved = true;
          if (baseFunc === compareFunc) {
            sameFunctionFound = true;
            resolvedFunctionName = baseFunc;
            break;
          } else {
            differentFunctionFound = true;
          }
        }
      }

      if (sameFunctionFound) {
        score += RISK_WEIGHTS.FUNCTION_OVERLAP; 
        reasons.push(`${overlappingLines.length} overlapping changed regions detected`);
        reasons.push(`Both branches modify function \`${resolvedFunctionName}\``);
      } else if (anyFunctionResolved && differentFunctionFound) {
        score += RISK_WEIGHTS.DIFFERENT_FUNCTION_OVERLAP;
        reasons.push(`${overlappingLines.length} overlapping changed regions detected`);
        reasons.push(`Branches modify overlapping lines but in different functions`);
      } else {
        // Fallback for non JS/TS files or when outside functions
        score += RISK_WEIGHTS.FUNCTION_OVERLAP; 
        reasons.push(`${overlappingLines.length} overlapping changed regions detected`);
        reasons.push(`Modifications highly likely affect the same function or structural block`);
      }
    } else if (getNearby(baseLines, compareLines)) {
      score += RISK_WEIGHTS.NEARBY_CHANGES;
      reasons.push(`Changes in nearby code regions (structural collision risk)`);
    }

    const commitsBase = await source.getFileCommitHistory(baseBranch, file, 10);
    const commitsCompare = await source.getFileCommitHistory(compareBranch, file, 10);

    const fileCommits = [...commitsBase, ...commitsCompare];
    totalCommitsAnalyzed += fileCommits.length;

    if (fileCommits.length > 4) {
      score += RISK_WEIGHTS.COMMIT_FREQUENCY;
      reasons.push(`High recent commit activity (${fileCommits.length} commits) indicates file instability`);
    }

    if (divergence.uniqueToA > 5 || divergence.uniqueToB > 5) {
      score += RISK_WEIGHTS.BRANCH_DIVERGENCE;
      reasons.push(`Branches have diverged significantly`);
    }

    commitsBase.forEach(c => {
      if (commitsCompare.some(cc => cc.author === c.author)) {
        sharedContributors.add(c.author);
      }
    });

    const structRisk = getStructuralRisk(file);
    if (structRisk > 0) {
      score += structRisk;
      reasons.push(`File type (${file.split('.').pop()}) has high structural sensitivity`);
    }

    if (sharedContributors.size > 0) {
      score += RISK_WEIGHTS.CONTRIBUTOR_OVERLAP;
      reasons.push(`Same contributor(s) modified file in both branches`);
    }

    score = Math.min(score, 100);

    fileRisks.push({
      file,
      score,
      level: classifyRisk(score),
      reasons,
      overlappingLines,
      baseLinesChanged: baseLines,
      compareLinesChanged: compareLines,
      commitFrequency: fileCommits.length,
      divergence
    });
  }

  // Also include files that were changed in compareBranch but not in baseBranch (Low risk)
  for (const file of compareChanged.filter(f => !baseChanged.includes(f))) {
    fileRisks.push({
      file,
      score: 5,
      level: "Low",
      reasons: ["File modified only in compare branch"],
      overlappingLines: [],
      baseLinesChanged: [],
      compareLinesChanged: parseDiffLines(await source.getDiff(baseBranch, compareBranch, file)),
      commitFrequency: 1,
      divergence
    });
  }

  // Calculate overall score
  fileRisks.sort((a, b) => b.score - a.score);
  const overallScore = fileRisks.length > 0 ? fileRisks[0].score : 0;

  return {
    overallScore,
    overallLevel: classifyRisk(overallScore),
    files: fileRisks,
    totalCommitsAnalyzed,
    sharedContributors: sharedContributors.size,
    divergence
  };
}
