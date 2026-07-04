import type { PathLike } from "fs";

import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { Transform, type TransformCallback } from "stream";
import { pipeline } from "stream/promises";

export const copyFile = async (
  source: PathLike,
  dest: PathLike,
  onChunk: (chunk: Buffer) => void = () => undefined,
): Promise<PathLike> => {
  const rs = createReadStream(path.resolve(source.toString()));
  const ws = createWriteStream(path.resolve(dest.toString()));

  const transform = new Transform({
    transform(
      chunk: Buffer,
      _encoding: BufferEncoding,
      callback: TransformCallback,
    ) {
      onChunk(chunk);
      callback(null, chunk);
    },
  });

  await pipeline(rs, transform, ws);

  return dest;
};
