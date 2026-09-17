import { styleText } from "node:util";

export const cyan = (str: string) => styleText("cyan", str);
export const green = (str: string) => styleText("green", str);
export const grey = (str: string) => styleText("grey", str);
export const red = (str: string) => styleText("red", str);

export const toMb = (bytes: number): string =>
  `${(bytes / 1024 / 1024).toFixed(2)}MB`;
export const toSeconds = (ms: number): string => `${(ms / 1000).toFixed(2)}s`;
