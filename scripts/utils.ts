import type { PathLike } from "node:fs";

import { cancel } from "@clack/prompts";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGunzip, createGzip } from "zlib";

type CancelScriptOptions =
  | {
      reason: string;
      trigger: "self";
    }
  | {
      reason?: string;
      trigger: "error" | "user";
    };

export const cancelScript = ({
  reason,
  trigger,
}: CancelScriptOptions): void => {
  switch (trigger) {
    case "error":
      cancel("Encountered an error while running a script");
      break;

    case "self":
      cancel(`Script cancelled - ${reason}`);
      break;

    case "user":
      cancel("Script cancelled by the user");
      break;
  }
};

export const measureTimeTaken = async <T>(
  callback: () => Promise<T> | T,
): Promise<{ result: T; timeTakenMs: number }> => {
  const start = performance.now();
  const result = await callback();
  const timeTakenMs = performance.now() - start;
  return { result, timeTakenMs };
};

export const msToSeconds = (val: number): string =>
  `${(val / 1000).toFixed(2)}s`;
export const bytesToMB = (val: number): string =>
  `${(val / 1024 / 1024).toFixed(2)}MB`;

export const copyFile = async (
  source: PathLike,
  dest: PathLike,
): Promise<PathLike> => {
  await pipeline(
    createReadStream(path.resolve(source.toString())),
    createWriteStream(path.resolve(dest.toString())),
  );
  return dest;
};

export const gzip = async (
  source: PathLike,
  dest: PathLike,
): Promise<PathLike> => {
  await pipeline(
    createReadStream(path.resolve(source.toString())),
    createGzip(),
    createWriteStream(path.resolve(dest.toString())),
  );

  return dest;
};

export const gunzip = async (
  source: PathLike,
  dest: PathLike,
): Promise<PathLike> => {
  await pipeline(
    createReadStream(path.resolve(source.toString())),
    createGunzip(),
    createWriteStream(path.resolve(dest.toString())),
  );

  return dest;
};
