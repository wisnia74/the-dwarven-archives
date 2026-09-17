import type { Stats } from "node:fs";

export interface Script {
  name: string;
  run: ([filepath, stats]: [string, Stats]) => Promise<void> | void;
}
