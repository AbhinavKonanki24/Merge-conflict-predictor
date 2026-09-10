import { describe, it, expect, vi } from 'vitest';
import { validateBranchName, getMergeBase } from '@fidesa/mcp-engine';
import path from 'path';

vi.mock('child_process', () => ({
  execFile: vi.fn((cmd, args, options, callback) => {
    callback(null, 'mocked output', '');
  })
}));

describe('git.ts security validations', () => {
  describe('validateBranchName', () => {
    it('accepts valid branch names', () => {
      expect(() => validateBranchName('main')).not.toThrow();
      expect(() => validateBranchName('feature/my-branch_123')).not.toThrow();
      expect(() => validateBranchName('fix.issue')).not.toThrow();
    });

    it('rejects shell metacharacters', () => {
      expect(() => validateBranchName('main; rm -rf /')).toThrow();
      expect(() => validateBranchName('feature|grep')).toThrow();
      expect(() => validateBranchName('fix&echo')).toThrow();
      expect(() => validateBranchName('test$(whoami)')).toThrow();
    });

    it('rejects path traversal attempts', () => {
      expect(() => validateBranchName('../../etc/passwd')).toThrow();
      expect(() => validateBranchName('main/..')).toThrow();
    });

    it('rejects branch names starting with a hyphen', () => {
      // Prevents options injection (e.g. --output=/tmp)
      expect(() => validateBranchName('-rf')).toThrow();
      expect(() => validateBranchName('--opt')).toThrow();
    });
  });

  describe('repoPath validation', () => {
    it('rejects paths outside of MCP_ALLOWED_ROOT', async () => {
      // Create a fake repo outside allowed root
      const fakeRoot = path.join(process.cwd(), '..');
      
      // Since it's async, we use rejects
      await expect(getMergeBase(fakeRoot, 'main', 'feature')).rejects.toThrow("Repo path is outside allowed root");
    });

    it('rejects non-existent paths', async () => {
      const fakePath = path.join(process.cwd(), 'does-not-exist-12345');
      await expect(getMergeBase(fakePath, 'main', 'feature')).rejects.toThrow("Repo path is not a valid directory");
    });
  });
});
