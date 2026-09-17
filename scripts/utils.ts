import assert from "node:assert/strict";

export const measureExecutionTime = async <T>(
  callback: () => Promise<T> | T,
): Promise<{ executionTimeMs: number; returnValue: T }> => {
  const start = performance.now();
  const returnValue = await callback();
  const executionTimeMs = performance.now() - start;
  return { executionTimeMs, returnValue };
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
