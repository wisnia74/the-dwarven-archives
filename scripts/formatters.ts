import { styleText } from "node:util";

export const red = (str: string) => styleText("red", str);
export const yellow = (str: string) => styleText("yellow", str);

export const toMb = (bytes: number): string =>
  `${(bytes / 1024 / 1024).toFixed(2)}MB`;
export const toSeconds = (ms: number): string => `${(ms / 1000).toFixed(2)}s`;
