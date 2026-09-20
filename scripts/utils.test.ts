import { describe, expect, it } from "vitest";

import { sortNestedObjectKeys } from "./utils";

describe("sortNestedObjectKeys", () => {
  it("sorts keys of nested objects", () => {
    /* eslint-disable perfectionist/sort-objects */
    const schema = {
      c: {
        c: 1,
        b: 2,
        a: 3,
      },
      b: {
        c: 1,
        b: 2,
        a: 3,
      },
      a: {
        c: 1,
        b: 2,
        a: 3,
      },
    };
    /* eslint-enable perfectionist/sort-objects */

    /* eslint-disable perfectionist/sort-objects */
    expect(sortNestedObjectKeys(schema)).toStrictEqual({
      c: {
        a: 3,
        b: 2,
        c: 1,
      },
      b: {
        a: 3,
        b: 2,
        c: 1,
      },
      a: {
        a: 3,
        b: 2,
        c: 1,
      },
    });
    /* eslint-enable perfectionist/sort-objects */
  });
});
