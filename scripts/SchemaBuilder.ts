import {
  BaseOutputBuilder,
  BaseOutputBuilderFactory,
} from "@nodable/base-output-builder";

type SerializableValue = Map<string, SerializableValue> | Set<string> | string;

export const recursivelyTransformMapOrSetToObject = (
  value: SerializableValue,
): unknown => {
  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries(), ([key, value]) => [
        key,
        recursivelyTransformMapOrSetToObject(value),
      ]),
    );
  }

  if (value instanceof Set) {
    return Array.from(value);
  }

  return value;
};

export const JSONstringifySchema = (
  schema: Map<string, Map<string, Set<string>>>,
): string => {
  return JSON.stringify(recursivelyTransformMapOrSetToObject(schema));
};

export class SchemaBuilder extends BaseOutputBuilder {
  private currentChildElement = "";
  private currentWrapperElement = "";
  private depth = -1;
  private schema = new Map<string, Map<string, Set<string>>>();

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

  override addValue(text: Parameters<BaseOutputBuilder["addValue"]>[0]): void {
    const wrapperSchema = this.schema.get(this.currentWrapperElement);

    wrapperSchema
      ?.get(this.currentChildElement)
      ?.add(this.depth < 2 ? typeof text : "object");
  }

  override closeElement(): void {
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

  override getOutput(): string {
    return JSONstringifySchema(this.schema);
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
