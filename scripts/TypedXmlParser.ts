import type { BaseOutputBuilderFactory } from "@nodable/base-output-builder";

import XMLParser, { type X2jOptions } from "@nodable/flexible-xml-parser";

/**
 * Default implementation of XMLParser does not infer `getOutput` type of provided
 * output builder class, requiring assertions to narrow down to correct type after `.getOutput()` is called.
 * This code makes XMLParser generic, allowing for:
 *
 * ```typescript
 * // return value type of new SomeBuilderFactory().getInstance().getOutput() is string
 * const parser = new TypedXmlParser({
 *   OutputBuilder: new SomeBuilderFactory(),
 *   skip: {
 *     declaration: true,
 *   },
 * })
 *
 * // typeof result === 'string', output type is preserved, no additional assertions needed
 * const result = await parser.parseStream(someStream);
 * ```
 */
export class TypedXmlParser<
  T extends BaseOutputBuilderFactory,
> extends XMLParser {
  declare OutputBuilder: T;

  // This constructor is useless only from runtime's perspective, it allows us
  // to bind options.OutputBuilder type to T generic field which in turn
  // allows us to preserver .getOutput() return value type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(
    options?: {
      OutputBuilder?: T;
    } & Omit<X2jOptions, "OutputBuilder">,
  ) {
    super(options);
  }

  override parseStream(
    readable: NodeJS.ReadableStream,
  ): Promise<ReturnType<ReturnType<T["getInstance"]>["getOutput"]>> {
    return super.parseStream(readable) as Promise<
      ReturnType<ReturnType<T["getInstance"]>["getOutput"]>
    >;
  }
}
