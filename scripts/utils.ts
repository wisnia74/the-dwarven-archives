import type { PathLike } from "node:fs";

import assert from "node:assert/strict";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { styleText } from "node:util";
import { createGunzip, createGzip } from "node:zlib";

export const green = (str: string) => styleText("green", str);
export const grey = (str: string) => styleText("grey", str);
export const red = (str: string) => styleText("red", str);

export const msToSeconds = (val: number): string =>
  `${(val / 1000).toFixed(2)}s`;
export const bytesToMB = (val: number): string =>
  `${(val / 1024 / 1024).toFixed(2)}MB`;

export const measureTimeTaken = async <T>(
  callback: () => Promise<T> | T,
): Promise<{ returnValue: T; timeTakenMs: number }> => {
  const start = performance.now();
  const returnValue = await callback();
  const timeTakenMs = performance.now() - start;
  return { returnValue, timeTakenMs };
};

export const sortNestedObjectKeys = (
  obj: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      typeof value === "object" && value !== null ?
        Object.fromEntries(
          Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
        )
      : value,
    ]),
  );

export const isObject = (val: unknown): val is Record<string, unknown> =>
  typeof val === "object" && val !== null;

export const assertActualIsSubsetOfExpected = (
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): void => {
  for (const [key, value] of Object.entries(actual)) {
    assert.ok(Object.hasOwn(expected, key), `Missing key: ${key}`);

    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        assert.ok(isObject(expected[key]));
        assert.ok(
          Object.hasOwn(expected[key], nestedKey),
          `Missing key: ${key}.${nestedKey}`,
        );

        assert.deepStrictEqual(expected[key][nestedKey], nestedValue);
      }
    } else {
      assert.deepStrictEqual(expected[key], value);
    }
  }
};

export const copy = async (
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
