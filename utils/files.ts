import type { PathLike } from "fs";

import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { createGunzip, createGzip } from "zlib";

export const bytesToMB = (val: number) => val / 1024 / 1024;

type OnChunkCallback = (chunk: Buffer | string) => void;

export const copyFile = async (
  source: PathLike,
  dest: PathLike,
  onChunk: OnChunkCallback,
): Promise<PathLike> => {
  const rs = createReadStream(path.resolve(source.toString()));
  const ws = createWriteStream(path.resolve(dest.toString()));

  rs.on("data", onChunk);

  await pipeline(rs, ws);

  return dest;
};

export const gzip = async (
  source: PathLike,
  dest: PathLike,
  onChunk: OnChunkCallback,
): Promise<PathLike> => {
  const rs = createReadStream(path.resolve(source.toString()));
  const ws = createWriteStream(path.resolve(dest.toString()));

  rs.on("data", onChunk);

  await pipeline(rs, createGzip(), ws);

  return dest;
};

export const gunzip = async (
  source: PathLike,
  dest: PathLike,
  onChunk: OnChunkCallback,
): Promise<PathLike> => {
  const rs = createReadStream(path.resolve(source.toString()));
  const ws = createWriteStream(path.resolve(dest.toString()));

  rs.on("data", onChunk);

  await pipeline(rs, createGunzip(), ws);

  return dest;
};
