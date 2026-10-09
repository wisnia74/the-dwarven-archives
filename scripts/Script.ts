import type { Stats } from "node:fs";

import { type KeypressEvent, makeTheme } from "@inquirer/core";

export const theme = makeTheme();

export interface Script {
  exec: ([filepath, stats]: [string, Stats]) => Promise<void> | void;
  helpText: string;
  isAvailable: (filename: string) => boolean;
  name: string;
  triggerKey: KeypressEvent["name"];
}
