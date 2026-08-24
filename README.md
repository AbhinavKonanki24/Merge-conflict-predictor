# Merge Conflict Predictor (MCP)

**"Know where your merge will break before you merge."**

MCP is a high-quality, non-destructive desktop/web tool that predicts likely Git merge conflicts before a developer attempts a merge. Instead of merely telling you which files changed, MCP analyzes overlapping edit regions, commit history, and structural sensitivity to provide a robust **Merge Risk Score**.

## Architecture

MCP is built with a Next.js (App Router) full-stack architecture running locally:
- **Frontend**: A highly responsive, professional dark-themed UI built with React, Tailwind CSS, and Framer Motion.
- **Backend**: Next.js API Routes (`/api/*`) executing local, non-destructive Git commands via `child_process`.
- **Analysis Engine**: A deterministic scoring algorithm that evaluates `git diff` and `git log` to calculate risk levels.

## Prediction Algorithm

The prediction engine combines multiple signals into a weighted score (0-100):

1. **Overlapping Edit Regions (+32):** Direct collision of changed line ranges.
2. **Function Overlap (+18):** Modifications very close to each other, indicating potential structural conflicts.
3. **Commit Frequency (+12):** Evaluates if a file has high churn by analyzing recent commits.
4. **Same File Modified (+10):** Base risk for two branches modifying the same file.
5. **Branch Divergence (+10):** Risk increases if branches have significantly diverged.
6. **Structural Sensitivity (+8):** Extra risk for lock files, `.json`, or configuration files.
7. **Nearby Changes (+6):** Structurally close edits that might not technically conflict but still carry integration risk.
8. **Contributor Overlap (+4):** Indicates active parallel development by shared contributors.

## Running the Project

Since MCP interacts with your local filesystem, clone and run it locally.

```bash
# 1. Install dependencies
npm install

# 2. Start the application
npm run dev

# 3. Open your browser
# Navigate to http://localhost:3000
```

## Demo Mode

For hackathon presentations, click **Try Demo Repository** on the landing page to instantly see a pre-calculated, highly-conflicted merge scenario, complete with risk explanations and diff highlighting.

## Limitations

- **Local Only:** Does not connect to GitHub/GitLab APIs.
- **No Automatic Merging:** MCP operates in a read-only analysis mode and will never modify your branch automatically.
- **Binary Files:** Excluded from detailed line-by-line analysis.

---
*Built for developers who want to avoid merge nightmares.*
