import fs from "fs";
import path from "path";
import { RiskLevel } from "./predictor";

export interface AnalysisRecord {
  id: string;
  repo: string;
  provider: "local" | "github" | "gitlab";
  baseBranch: string;
  compareBranch: string;
  overallScore: number;
  overallLevel: RiskLevel;
  timestamp: string;
}

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "history.json");

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
}

export function saveAnalysis(record: Omit<AnalysisRecord, "id" | "timestamp">) {
  ensureDb();
  const data = fs.readFileSync(DB_FILE, "utf-8");
  const history: AnalysisRecord[] = JSON.parse(data);
  
  const newRecord: AnalysisRecord = {
    ...record,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString()
  };
  
  history.push(newRecord);
  fs.writeFileSync(DB_FILE, JSON.stringify(history, null, 2));
  return newRecord;
}

export function getHistory(): AnalysisRecord[] {
  try {
    ensureDb();
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data).sort((a: AnalysisRecord, b: AnalysisRecord) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (e) {
    return [];
  }
}
