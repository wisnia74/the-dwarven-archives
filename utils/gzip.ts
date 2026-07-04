import type { PathLike } from "fs";

import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { createGunzip, createGzip } from "zlib";

export const gzip = async (source: PathLike): Promise<PathLike> => {
  const dest = path.resolve(source.toString()).concat(".gz");

  await pipeline(
    createReadStream(source),
    createGzip(),
    createWriteStream(dest),
  );

  return dest;
};

export const gunzip = async (source: PathLike): Promise<PathLike> => {
  if (!source.toString().endsWith(".gz")) {
    throw new Error('Expected source filepath to end with ".gz"');
  }

  const dest = path.resolve(source.toString()).slice(0, -3);

  await pipeline(
    createReadStream(source),
    createGunzip(),
    createWriteStream(dest),
  );

  return dest;
};
