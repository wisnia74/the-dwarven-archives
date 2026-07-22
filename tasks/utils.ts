import type { PathLike } from "fs";

import { cancel, progress } from "@clack/prompts";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import { createGunzip, createGzip } from "zlib";

type CancelTaskOptions =
  | {
      reason: string;
      trigger: "self";
    }
  | {
      reason?: string;
      trigger: "error" | "user";
    };

export const cancelTask = ({ reason, trigger }: CancelTaskOptions): void => {
  switch (trigger) {
    case "error":
      cancel("Encountered an error while running a task");
      break;

    case "self":
      cancel(`Task cancelled - ${reason}`);
      break;

    case "user":
      cancel("Task cancelled by the user");
      break;
  }
};

type AdvanceProgressCallback = (
  delta: number,
  createLabel: (currentProgress: number, maxProgress: number) => string,
) => void;

export const trackProgress = async <T>({
  createEndMessage,
  exec,
  maxProgress,
}: {
  createEndMessage: () => Promise<string> | string;
  exec: (advanceProgress: AdvanceProgressCallback) => Promise<T>;
  maxProgress: number;
}): Promise<T> => {
  let currentProgress = 0;

  const prog = progress({
    indicator: "timer",
    max: maxProgress,
    style: "block",
  });

  prog.start();

  const result = await exec((delta, createLabel) => {
    currentProgress += delta;

    prog.advance(delta, createLabel(currentProgress, maxProgress));
  });

  prog.stop(await createEndMessage());

  return result;
};

export const bytesToMB = (val: number) => val / 1024 / 1024;

type OnChunkCallback = (chunk: Buffer) => void;

const createChunkObserver = (onChunk: OnChunkCallback): Transform => {
  return new Transform({
    transform(chunk, _encoding, callback) {
      onChunk(chunk as Buffer);
      callback(null, chunk);
    },
  });
};

export const copyFile = async (
  source: PathLike,
  dest: PathLike,
  onChunk: OnChunkCallback,
): Promise<PathLike> => {
  await pipeline(
    createReadStream(path.resolve(source.toString())),
    createChunkObserver(onChunk),
    createWriteStream(path.resolve(dest.toString())),
  );

  return dest;
};

export const gzip = async (
  source: PathLike,
  dest: PathLike,
  onChunk: OnChunkCallback,
): Promise<PathLike> => {
  await pipeline(
    createReadStream(path.resolve(source.toString())),
    createChunkObserver(onChunk),
    createGzip(),
    createWriteStream(path.resolve(dest.toString())),
  );

  return dest;
};

export const gunzip = async (
  source: PathLike,
  dest: PathLike,
  onChunk: OnChunkCallback,
): Promise<PathLike> => {
  await pipeline(
    createReadStream(path.resolve(source.toString())),
    createChunkObserver(onChunk),
    createGunzip(),
    createWriteStream(path.resolve(dest.toString())),
  );

  return dest;
};
