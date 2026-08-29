import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST } from './route';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

describe('/api/analyze API Route', () => {
  let repoPath: string;
  let originalAllowedRoot: string | undefined;

  beforeAll(() => {
    originalAllowedRoot = process.env.MCP_ALLOWED_ROOT;
    process.env.MCP_ALLOWED_ROOT = os.tmpdir();
    
    // Set up a throwaway git repo
    repoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-repo-'));
    const exec = (cmd: string) => execSync(cmd, { cwd: repoPath, stdio: 'ignore' });
    
    // Initialize git
    exec('git init -b main'); // Ensure main is default
    exec('git config user.name "Test User"');
    exec('git config user.email "test@example.com"');
    
    // Create base commit
    fs.writeFileSync(path.join(repoPath, 'file.txt'), 'line 1\nline 2\nline 3\n');
    exec('git add .');
    exec('git commit -m "initial commit"');
    
    // Create feature-a branch
    exec('git checkout -b feature-a');
    fs.writeFileSync(path.join(repoPath, 'file.txt'), 'line 1\nline 2 changed by A\nline 3\n');
    exec('git commit -am "feature A change"');
    
    // Create feature-b branch off main
    exec('git checkout main');
    exec('git checkout -b feature-b');
    fs.writeFileSync(path.join(repoPath, 'file.txt'), 'line 1\nline 2 changed by B\nline 3\n');
    exec('git commit -am "feature B change"');
  });

  afterAll(() => {
    if (originalAllowedRoot !== undefined) {
      process.env.MCP_ALLOWED_ROOT = originalAllowedRoot;
    } else {
      delete process.env.MCP_ALLOWED_ROOT;
    }
    
    if (repoPath) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }
  });

  it('detects conflict between feature-a and feature-b', async () => {
    const request = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        repoPath,
        baseBranch: 'feature-a',
        compareBranch: 'feature-b'
      })
    });

    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.files).toBeDefined();
    expect(data.files.length).toBeGreaterThan(0);
    expect(data.files[0].file).toBe('file.txt');
    expect(data.files[0].overlappingLines.length).toBeGreaterThan(0);
    expect(data.files[0].level).toMatch(/High|Critical/);
  });
});
