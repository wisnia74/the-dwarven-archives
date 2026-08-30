import type { MatcherView } from "path-expression-matcher";

import {
  BaseOutputBuilder,
  BaseOutputBuilderFactory,
} from "@nodable/base-output-builder";

type SerializableValue = Map<string, SerializableValue> | Set<string> | string;

const JSONstringifySchema = (
  schema: Map<string, Map<string, Set<string>>>,
): string => {
  const deepMapAndSetToObject = (value: SerializableValue): unknown => {
    if (value instanceof Map) {
      return Object.fromEntries(
        Array.from(value.entries(), ([key, value]) => [
          key,
          deepMapAndSetToObject(value),
        ]),
      );
    }

    if (value instanceof Set) {
      return Array.from(value);
    }

    return value;
  };

  return JSON.stringify(deepMapAndSetToObject(schema));
};

type Schema = Map<string, Map<string, Set<string>>>;

/**
 * Builds a schema from XML elements encountered while parsing.
 *
 * The schema only describes direct children of the root/wrapper element.
 * Nested elements are represented as `"object"` on their direct parent.
 *
 * Element types are inferred as follows:
 *
 * - An element containing text is classified by the text value's type
 *   (currently `"string"`).
 * - An element containing nested elements is classified as `"object"`.
 * - An empty element with no text or nested elements is classified as
 *   `"presence_based_boolean"`:
 *     - present: `true`
 *     - absent: `false`
 *
 * Multiple occurrences of the same element are merged into a Set of
 * observed types.
 *
 * Example:
 *
 * Input:
 *
 * ```xml
 * <config>
 *   <name>John</name>
 *   <enabled />
 *   <address>
 *     <city>London</city>
 *   </address>
 * </config>
 * ```
 *
 * Produces a schema equivalent to:
 *
 * ```ts
 * {
 *   config: {
 *     name: ["string"],
 *     enabled: ["presence_based_boolean"],
 *     address: ["object"],
 *   }
 * }
 * ```
 *
 * Repeated elements may produce multiple types. For example:
 *
 * ```xml
 * <config>
 *   <value>hello</value>
 *   <value>
 *     <nested />
 *   </value>
 * </config>
 * ```
 *
 * produces:
 *
 * ```ts
 * {
 *   config: {
 *     value: ["string", "object"],
 *   }
 * }
 * ```
 */

export class SchemaBuilder extends BaseOutputBuilder {
  private currentChildElement = "";
  private currentWrapperElement = "";
  private depth = -1;
  private schema: Schema = new Map();

  addElement(tag: { name: string }): void {
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
      this.currentChildElement = tag.name;
    }

    if (this.depth < 2) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const wrapperSchema = this.schema.get(this.currentWrapperElement)!;

      if (!wrapperSchema.has(this.currentChildElement)) {
        wrapperSchema.set(this.currentChildElement, new Set());
      }
    }
  }

  addValue(value: string): void {
    const wrapperSchema = this.schema.get(this.currentWrapperElement);

    wrapperSchema
      ?.get(this.currentChildElement)
      ?.add(this.depth < 2 ? typeof value : "object");
  }

  closeElement(): void {
    if (this.depth >= 2) {
      this.schema
        .get(this.currentWrapperElement)
        ?.get(this.currentChildElement)
        ?.add("object");
    }

    this.depth--;

    if (this.depth < 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const wrapperSchema = this.schema.get(this.currentWrapperElement)!;

      for (const [, types] of wrapperSchema) {
        if (types.size === 0) {
          types.add("presence_based_boolean");
        }
      }

      this.currentWrapperElement = "";
    }

    this.currentChildElement = "";
  }

  getOutput(): string {
    return JSONstringifySchema(this.schema);
  }
}

export class SchemaBuilderFactory extends BaseOutputBuilderFactory {
  constructor(builderOptions: object = {}) {
    super(builderOptions);
  }

  getInstance(
    parserOptions: object = {},
    readonlyMatcher: MatcherView | null = null,
  ) {
    return new SchemaBuilder(
      parserOptions,
      this.builderOptions,
      readonlyMatcher,
      this.registry,
    );
  }
}
