import type { PathLike } from "fs";

import { cancel } from "@clack/prompts";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { pipeline } from "stream/promises";
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

/**
 * It averages 5s to copy 1GB file on my PC, if this ever becomes a bottleneck
 * of any sort, deep dive into positional I/O writes, with pre-allocated
 * destination file WITHOUT using worker threads
 */
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
