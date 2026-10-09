import type { KeypressEvent } from "@inquirer/core";
import type { Stats } from "node:fs";

export interface Script {
  exec: ([filepath, stats]: [string, Stats]) => Promise<void> | void;
  helpText: string;
  isAvailable: (filename: string) => boolean;
  name: string;
  triggerKey: KeypressEvent["name"];
}
