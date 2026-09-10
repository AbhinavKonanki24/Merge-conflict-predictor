import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateBranchName, getBranches, getMergeBase } from '@fidesa/mcp-engine';
import fs from 'fs';
import path from 'path';

// Mock child_process.execFile to prevent actual execution during tests
vi.mock('child_process', () => ({
  execFile: vi.fn((cmd, args, options, callback) => {
    callback(null, { stdout: '', stderr: '' });
  }),
}));

describe('git.ts security and validation', () => {
  describe('validateBranchName', () => {
    it('accepts valid branch names', () => {
      expect(() => validateBranchName('main')).not.toThrow();
      expect(() => validateBranchName('feature/awesome-feature_123')).not.toThrow();
      expect(() => validateBranchName('bugfix.v1-release')).not.toThrow();
    });

    it('rejects malicious branch names', () => {
      expect(() => validateBranchName('main; rm -rf /')).toThrow();
      expect(() => validateBranchName('feature|grep')).toThrow();
      expect(() => validateBranchName('$(whoami)')).toThrow();
      expect(() => validateBranchName('`ls`')).toThrow();
      expect(() => validateBranchName('main&echo')).toThrow();
      expect(() => validateBranchName('..')).toThrow();
    });
  });

  describe('Path traversal and validation in runGitCommand (via getBranches)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
      process.env.MCP_ALLOWED_ROOT = path.resolve(process.cwd(), 'allowed_root');
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('rejects relative paths', async () => {
      await expect(getBranches('some-repo')).rejects.toThrow("Repo path must be absolute");
      await expect(getBranches('../some-repo')).rejects.toThrow("Repo path must be absolute");
    });

    it('rejects absolute paths containing ..', async () => {
      // By using string concatenation, we prevent path.join from resolving '..'
      const badPath = `${process.env.MCP_ALLOWED_ROOT}${path.sep}..${path.sep}forbidden`;
      await expect(getBranches(badPath)).rejects.toThrow("Repo path cannot contain '..'");
    });

    it('rejects paths outside MCP_ALLOWED_ROOT', async () => {
      const outsidePath = path.resolve(process.cwd(), 'outside_repo');
      await expect(getBranches(outsidePath)).rejects.toThrow("Repo path is outside allowed root");
    });
    
    it('rejects non-existent directory', async () => {
      const nonExistentPath = path.resolve(process.env.MCP_ALLOWED_ROOT!, 'nonexistent');
      await expect(getBranches(nonExistentPath)).rejects.toThrow("Repo path is not a valid directory");
    });
  });
});
