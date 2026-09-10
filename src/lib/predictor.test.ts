import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyRisk, analyzeMergeRisk, DiffSource, parseDiffLines, getOverlap, getNearby, getStructuralRisk } from '@fidesa/mcp-engine';

describe('predictor.ts', () => {
  let mockSource: DiffSource;

  beforeEach(() => {
    mockSource = {
      getDivergence: vi.fn().mockResolvedValue({ uniqueToA: 0, uniqueToB: 0 }),
      getChangedFiles: vi.fn().mockResolvedValue([]),
      getDiff: vi.fn().mockResolvedValue(''),
      getFileCommitHistory: vi.fn().mockResolvedValue([]),
      getFileContent: vi.fn().mockResolvedValue('')
    };
  });

  describe('classifyRisk', () => {
    it('returns correct risk levels at boundaries', () => {
      expect(classifyRisk(0)).toBe("Low");
      expect(classifyRisk(39)).toBe("Low");
      expect(classifyRisk(40)).toBe("Medium");
      expect(classifyRisk(59)).toBe("Medium");
      expect(classifyRisk(60)).toBe("High");
      expect(classifyRisk(79)).toBe("High");
      expect(classifyRisk(80)).toBe("Critical");
      expect(classifyRisk(100)).toBe("Critical");
    });
  });

  describe('analyzeMergeRisk AST function overlap', () => {
    it('scores AST function overlap correctly for same function', async () => {
      (mockSource.getChangedFiles as any).mockResolvedValue(['test.ts']);
      // We simulate an overlap between lines 5-6
      (mockSource.getDiff as any).mockResolvedValue(`@@ -4,0 +5,2 @@`); 
      
      const fileContent = `
function foo() {
  console.log('hi');
  const a = 1;
  const b = 2;
}
`;
      // Start line of function foo is 2, end line is 6.
      // So line 5 is inside foo.
      (mockSource.getFileContent as any).mockResolvedValue(fileContent);

      const result = await analyzeMergeRisk(mockSource, 'base', 'compare');
      const fileRisk = result.files[0];
      
      expect(fileRisk.reasons).toContain('Both branches modify function `foo`');
      
      // BASE_SCORE: SAME_FILE (10) + LINE_OVERLAP (32) + FUNCTION_OVERLAP (18) = 60
      expect(fileRisk.score).toBe(60); 
    });

    it('scores AST function overlap correctly for different functions', async () => {
      (mockSource.getChangedFiles as any).mockResolvedValue(['test.ts']);
      // Same overlap detected in diff
      (mockSource.getDiff as any).mockResolvedValue(`@@ -4,0 +5,2 @@`); 
      
      const baseContent = `
function foo() {
  // line 3
  // line 4
  // line 5
}
`;
      // Base branch thinks line 5 is inside foo.
      (mockSource.getFileContent as any).mockImplementation((branch: string) => {
         if (branch === 'base') return Promise.resolve(baseContent);
         return Promise.resolve(`
function bar() {
  // line 3
  // line 4
  // line 5
}
`);
      });

      const result = await analyzeMergeRisk(mockSource, 'base', 'compare');
      const fileRisk = result.files[0];
      
      expect(fileRisk.reasons).toContain('Branches modify overlapping lines but in different functions');
      
      // BASE_SCORE: SAME_FILE (10) + LINE_OVERLAP (32) + DIFFERENT_FUNCTION_OVERLAP (10) = 52
      expect(fileRisk.score).toBe(52);
    });

    it('falls back to standard simulated overlap if AST parsing fails or file is not JS/TS', async () => {
      (mockSource.getChangedFiles as any).mockResolvedValue(['test.py']);
      // Same overlap detected in diff
      (mockSource.getDiff as any).mockResolvedValue(`@@ -4,0 +5,2 @@`); 
      
      (mockSource.getFileContent as any).mockResolvedValue("def foo():\n  pass\n");

      const result = await analyzeMergeRisk(mockSource, 'base', 'compare');
      const fileRisk = result.files[0];
      
      expect(fileRisk.reasons).toContain('Modifications highly likely affect the same function or structural block');
      
      // BASE_SCORE: SAME_FILE (10) + LINE_OVERLAP (32) + FUNCTION_OVERLAP (18) = 60
      expect(fileRisk.score).toBe(60);
    });
  });

  describe('pure functions', () => {
    it('parseDiffLines extracts line ranges correctly', () => {
      const diff = "@@ -10,0 +11,5 @@\n+line\n@@ -20,2 +25,1 @@";
      const result = parseDiffLines(diff);
      expect(result).toEqual([{ start: 11, end: 15 }, { start: 25, end: 25 }]);
    });

    it('getOverlap correctly finds overlapping ranges', () => {
      const rangeA = [{ start: 5, end: 10 }, { start: 20, end: 25 }];
      const rangeB = [{ start: 8, end: 12 }, { start: 30, end: 35 }];
      expect(getOverlap(rangeA, rangeB)).toEqual([{ start: 8, end: 10 }]);
    });

    it('getNearby detects ranges within distance', () => {
      const rangeA = [{ start: 10, end: 10 }];
      const rangeB = [{ start: 15, end: 15 }];
      expect(getNearby(rangeA, rangeB, 5)).toBe(true);
      expect(getNearby(rangeA, rangeB, 4)).toBe(false);
    });

    it('getStructuralRisk returns correct values based on file type', () => {
      expect(getStructuralRisk('package.json')).toBe(8); // RISK_WEIGHTS.STRUCTURAL_SENSITIVITY
      expect(getStructuralRisk('yarn.lock')).toBe(8);
      expect(getStructuralRisk('app.tsx')).toBe(0);
    });

    it('classifyRisk correctly assigns boundaries', () => {
      expect(classifyRisk(39)).toBe('Low');
      expect(classifyRisk(40)).toBe('Medium');
      expect(classifyRisk(59)).toBe('Medium');
      expect(classifyRisk(60)).toBe('High');
      expect(classifyRisk(79)).toBe('High');
      expect(classifyRisk(80)).toBe('Critical');
      expect(classifyRisk(100)).toBe('Critical');
    });
  });
});
