import {
  BaseOutputBuilder,
  BaseOutputBuilderFactory,
} from "@nodable/base-output-builder";
import assert from "node:assert/strict";
import { fromError } from "zod-validation-error";

import { regionSchema, siteSchema, undergroundRegionSchema } from "~/schema";

const SUPPORTED_ELEMENTS = [
  // "artifact",
  // "dance_form",
  // "entity",
  // "entity_population",
  // "historical_era",
  // "historical_event_collection",
  // "historical_event",
  // "historicol_figure",
  // "musical_form",
  // "poetic_form",
  "region",
  "site",
  "underground_region",
  // "written_content",
] as const;

const isSupportedElement = (
  str: string,
): str is (typeof SUPPORTED_ELEMENTS)[number] => {
  // @ts-expect-error not sure whether I'm doing something wrong or TypeScript is being too strict with .includes()
  return SUPPORTED_ELEMENTS.includes(str);
};

const getSchema = (
  element: (typeof SUPPORTED_ELEMENTS)[number],
): typeof regionSchema | typeof siteSchema | typeof undergroundRegionSchema =>
  ({
    region: regionSchema,
    site: siteSchema,
    underground_region: undergroundRegionSchema,
  })[element];

export class LegendsParseOutputBuilder extends BaseOutputBuilder {
  private elementContent: Record<string, string> = {};
  private elementStack: string[] = [];

  private encounteredUnsupportedElements = new Map<string, number>();

  private errors: Set<string> = new Set<string>();

  override addElement(
    tag: Parameters<BaseOutputBuilder["addElement"]>[0],
  ): void {
    this.elementStack.push(tag.name);

    if (!isSupportedElement(this.elementStack[0])) {
      const currentCount = this.encounteredUnsupportedElements.get(
        this.elementStack[0],
      );

      this.encounteredUnsupportedElements.set(
        this.elementStack[0],
        currentCount ? currentCount + 1 : 1,
      );

      return;
    }
  }

  override addValue(text: Parameters<BaseOutputBuilder["addValue"]>[0]): void {
    if (!isSupportedElement(this.elementStack[0])) {
      return;
    }

    const lastElement = this.elementStack.at(-1);
    assert.ok(lastElement);

    this.elementContent[lastElement] = text;
  }

  override closeElement(): void {
    const topmostParentElement = this.elementStack[0];

    if (
      this.elementStack.length === 1
      && isSupportedElement(topmostParentElement)
    ) {
      const schema = getSchema(topmostParentElement);
      const parseResult = schema.safeParse(this.elementContent);

      if (!parseResult.success) {
        this.errors.add(
          `[${this.elementStack[0]}] ${fromError(parseResult.error).toString()}`,
        );
      }

      this.elementContent = {};
    }

    this.elementStack.pop();
  }

  override getOutput():
    | { errors: string[]; success: false; warnings?: string[] }
    | { success: true; warnings?: string[] } {
    const warnings = Array.from(
      this.encounteredUnsupportedElements.entries(),
      ([element, count]) =>
        [
          `Encountered`,
          ...(count > 1 ?
            [`${count.toString()} unsupported elements: ${element}`]
          : [`unsupported element: ${element}`]),
        ].join(" "),
    );

    if (this.errors.size === 0) {
      return {
        success: true,
        ...(warnings.length ?
          {
            warnings,
          }
        : {}),
      };
    }

    return {
      errors: [...this.errors],
      success: false,
      ...(warnings.length ?
        {
          warnings,
        }
      : {}),
    };
  }
}

export class LegendsParseOutputBuilderFactory extends BaseOutputBuilderFactory {
  override getInstance(
    ...[parserOptions, readonlyMatcher]: Parameters<
      BaseOutputBuilderFactory["getInstance"]
    >
  ) {
    return new LegendsParseOutputBuilder(
      parserOptions,
      this.builderOptions,
      readonlyMatcher,
      this.registry,
    );
  }
}
