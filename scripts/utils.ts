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
