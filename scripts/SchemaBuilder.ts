import {
  BaseOutputBuilder,
  BaseOutputBuilderFactory,
} from "@nodable/base-output-builder";
import assert from "node:assert/strict";

import { isObject, sortNestedObjectKeys } from "./utils";

export type SerializableValue =
  Map<string, SerializableValue> | Set<string> | string;

export const toStringifiableValue = (value: SerializableValue): unknown => {
  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries(), ([key, value]) => [
        key,
        toStringifiableValue(value),
      ]),
    );
  }

  if (value instanceof Set) {
    return Array.from(value);
  }

  return value;
};

export class SchemaBuilder extends BaseOutputBuilder {
  private childCountWithinCurrentWrapper = new Map<string, number>();
  private currentChild = "";

  private currentWrapper = "";

  private depth = -1;

  private readonly schema = new Map<string, Map<string, Set<string>>>();

  override addElement(
    tag: Parameters<BaseOutputBuilder["addElement"]>[0],
  ): void {
    if (this.depth < 0) {
      this.currentWrapper = tag.name;

      if (!this.schema.has(this.currentWrapper)) {
        this.schema.set(this.currentWrapper, new Map());
      }

      this.depth++;
      return;
    }

    if (this.currentWrapper === tag.name) {
      return;
    }

    this.depth++;

    if (this.depth === 1) {
      this.currentChild = tag.name;

      const childCount = this.childCountWithinCurrentWrapper.get(tag.name);

      this.childCountWithinCurrentWrapper.set(
        tag.name,
        childCount ? childCount + 1 : 1,
      );
    }

    if (this.depth < 2) {
      const wrapperSchema = this.schema.get(this.currentWrapper);
      assert.ok(!!wrapperSchema);

      if (!wrapperSchema.has(this.currentChild)) {
        wrapperSchema.set(this.currentChild, new Set());
      }
    }
  }

  override addValue(text: Parameters<BaseOutputBuilder["addValue"]>[0]): void {
    const wrapperSchema = this.schema.get(this.currentWrapper);
    assert.ok(!!wrapperSchema);

    const currentChildSchema = wrapperSchema.get(this.currentChild);

    if (this.depth > 1) {
      currentChildSchema?.add("json_array");

      return;
    }

    const currentChildCount = this.childCountWithinCurrentWrapper.get(
      this.currentChild,
    );

    assert.ok(!!currentChildCount);

    if (currentChildCount < 2) {
      if (!currentChildSchema?.has("json_array")) {
        currentChildSchema?.add(typeof text);

        return;
      }

      return;
    }

    currentChildSchema?.clear();
    currentChildSchema?.add("json_array");
  }

  override closeElement(): void {
    const wrapperSchema = this.schema.get(this.currentWrapper);
    assert.ok(!!wrapperSchema);

    if (this.depth >= 2) {
      wrapperSchema.get(this.currentChild)?.add("json_array");
    }

    this.depth--;

    if (this.depth < 0) {
      for (const [, types] of wrapperSchema) {
        if (types.size === 0) {
          types.add("boolean");
        }
      }

      this.currentWrapper = "";
      this.childCountWithinCurrentWrapper = new Map();
    }

    this.currentChild = "";
  }

  override getOutput(): string {
    const stringifiableSchema = toStringifiableValue(this.schema);
    assert.ok(isObject(stringifiableSchema));

    return JSON.stringify(sortNestedObjectKeys(stringifiableSchema));
  }
}

export class SchemaBuilderFactory extends BaseOutputBuilderFactory {
  override getInstance(
    ...[parserOptions, readonlyMatcher]: Parameters<
      BaseOutputBuilderFactory["getInstance"]
    >
  ) {
    return new SchemaBuilder(
      parserOptions,
      this.builderOptions,
      readonlyMatcher,
      this.registry,
    );
  }
}
