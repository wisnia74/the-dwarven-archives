import {
  BaseOutputBuilder,
  BaseOutputBuilderFactory,
} from "@nodable/base-output-builder";
import assert from "node:assert/strict";

import { isObject, sortNestedObjectKeys } from "~/scripts/utils";

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
  private currentFirstChildElement = "";
  private currentWrapperElement = "";
  private depth = -1;
  private readonly schema = new Map<string, Map<string, Set<string>>>();

  override addElement(
    tag: Parameters<BaseOutputBuilder["addElement"]>[0],
  ): void {
    if (this.depth < 0) {
      this.currentWrapperElement = tag.name;

      if (!this.schema.has(this.currentWrapperElement)) {
        this.schema.set(this.currentWrapperElement, new Map());
      }

      this.depth++;
      return;
    }

    if (this.currentWrapperElement === tag.name) {
      return;
    }

    this.depth++;

    if (this.depth === 1) {
      this.currentFirstChildElement = tag.name;
    }

    if (this.depth < 2) {
      const wrapperElementSchema = this.schema.get(this.currentWrapperElement);
      assert.ok(!!wrapperElementSchema);

      if (!wrapperElementSchema.has(this.currentFirstChildElement)) {
        wrapperElementSchema.set(this.currentFirstChildElement, new Set());
      }
    }
  }

  override addValue(text: Parameters<BaseOutputBuilder["addValue"]>[0]): void {
    const wrapperElementSchema = this.schema.get(this.currentWrapperElement);
    assert.ok(!!wrapperElementSchema);

    wrapperElementSchema
      .get(this.currentFirstChildElement)
      ?.add(this.depth < 2 ? typeof text : "json_array");
  }

  override closeElement(): void {
    const wrapperElementSchema = this.schema.get(this.currentWrapperElement);
    assert.ok(!!wrapperElementSchema);

    if (this.depth >= 2) {
      wrapperElementSchema
        .get(this.currentFirstChildElement)
        ?.add("json_array");
    }

    this.depth--;

    if (this.depth < 0) {
      for (const [, types] of wrapperElementSchema) {
        if (types.size === 0) {
          types.add("boolean");
        }
      }

      this.currentWrapperElement = "";
    }

    this.currentFirstChildElement = "";
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
