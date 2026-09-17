import { describe, expect, it } from "vitest";

import { assertActualIsSubsetOfExpected, sortNestedObjectKeys } from "./utils";

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

describe("assertActualIsSubsetOfExpected", () => {
  it("doesn't throw if actual object is a subset of expected object", () => {
    expect(() => {
      assertActualIsSubsetOfExpected(
        {
          a: {
            a: 1,
          },
        },
        {
          a: {
            a: 1,
          },
          b: {
            b: 2,
          },
        },
      );
    }).not.toThrow();

    expect(() => {
      assertActualIsSubsetOfExpected(
        {
          a: {
            a: [1],
          },
        },
        {
          a: {
            a: [1],
          },
          b: {
            b: 2,
          },
        },
      );
    }).not.toThrow();
  });

  it("throws is actual object isn't a subset of expected object", () => {
    expect(() => {
      assertActualIsSubsetOfExpected(
        {
          d: {
            d: 4,
          },
        },
        {
          a: {
            a: 1,
          },
        },
      );
    }).toThrow();

    expect(() => {
      assertActualIsSubsetOfExpected(
        {
          a: {
            a: "1",
          },
        },
        {
          a: {
            a: 1,
          },
        },
      );
    }).toThrow();

    expect(() => {
      assertActualIsSubsetOfExpected(
        {
          a: {
            a: ["1"],
          },
        },
        {
          a: {
            a: [1],
          },
        },
      );
    }).toThrow();
  });
});
