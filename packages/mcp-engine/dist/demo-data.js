"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEMO_PREDICTION = exports.DEMO_BRANCHES = void 0;
exports.DEMO_BRANCHES = {
    current: "feature/payment",
    branches: ["main", "feature/payment", "feature/checkout", "bugfix/auth"],
};
exports.DEMO_PREDICTION = {
    overallScore: 78,
    overallLevel: "High",
    totalCommitsAnalyzed: 18,
    sharedContributors: 2,
    divergence: { uniqueToA: 4, uniqueToB: 9 },
    files: [
        {
            file: "src/payment/checkout.ts",
            score: 92,
            level: "Critical",
            reasons: [
                "Same function modified by both branches",
                "23 overlapping changed lines",
                "4 recent commits touched this region",
                "Branches diverged 9 commits ago",
            ],
            commitFrequency: 4,
            divergence: { uniqueToA: 4, uniqueToB: 9 },
            baseLinesChanged: [{ start: 126, end: 148 }],
            compareLinesChanged: [{ start: 130, end: 171 }],
            overlappingLines: [{ start: 130, end: 148 }],
        },
        {
            file: "src/payment/cart.ts",
            score: 78,
            level: "High",
            reasons: [
                "Same file modified in both branches",
                "Changes in nearby code regions (structural collision risk)",
                "High recent commit activity (8 commits)",
            ],
            commitFrequency: 8,
            divergence: { uniqueToA: 4, uniqueToB: 9 },
            baseLinesChanged: [{ start: 45, end: 60 }],
            compareLinesChanged: [{ start: 62, end: 80 }],
            overlappingLines: [],
        },
        {
            file: "src/components/PaymentForm.tsx",
            score: 64,
            level: "High",
            reasons: [
                "Same file modified in both branches",
                "Same contributor(s) modified file in both branches",
            ],
            commitFrequency: 2,
            divergence: { uniqueToA: 4, uniqueToB: 9 },
            baseLinesChanged: [{ start: 10, end: 15 }],
            compareLinesChanged: [{ start: 120, end: 130 }],
            overlappingLines: [],
        },
        {
            file: "config/payment.json",
            score: 48,
            level: "Medium",
            reasons: [
                "File type (json) has high structural sensitivity",
                "Same file modified in both branches",
            ],
            commitFrequency: 1,
            divergence: { uniqueToA: 4, uniqueToB: 9 },
            baseLinesChanged: [{ start: 5, end: 8 }],
            compareLinesChanged: [{ start: 20, end: 22 }],
            overlappingLines: [],
        }
    ]
};
