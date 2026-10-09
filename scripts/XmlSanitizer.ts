import type { SequentialStreamBuilder } from "@nodable/sequential-stream-builder";

import iconv from "iconv-lite";
import assert from "node:assert/strict";
import { Transform } from "node:stream";

export type Sanitizer = (str: string) => string;

/**
 * Returns string stripped of characters that are not in the {@link https://www.w3.org/TR/xml/#charsets XML 1.0 allowed-character ranges}.
 */
export const stripForbiddenXmlUnicodeCharacters: Sanitizer = (str: string) =>
  str.replace(
    // eslint-disable-next-line no-control-regex
    /[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu,
    "",
  );

export type Decoder = (typeof iconv)["decode"];

/**
 * A custom {@link Transform} stream that expects to receive a `cp437` encoded chunk of legends file,
 * which it transforms by flattening known top-level wrapper elements, such as:
 *
 * ```xml
 * <df_world>
 *   <regions>...</regions>
 *   <underground_regions>...</underground_regions>
 *   <sites>...</sites>
 *   <artifacts>...</artifacts>
 *   <historical_figures>...</historical_figures>
 *   <entity_populations>...</entity_populations>
 *   <entities>...</entities>
 *   <historical_events>...</historical_events>
 *   <historical_event_collections>...</historical_event_collections>
 *   <historical_eras>...</historical_eras>
 *   <written_contents>...</written_contents>
 *   <poetic_forms>...</poetic_forms>
 *   <musical_forms>...</musical_forms>
 *   <dance_forms>...</dance_forms>
 *   <world_constructions>...</world_constructions>
 * </df_world>
 * ```
 *
 * and stripping {@link https://www.w3.org/TR/xml/#charsets illegal XML 1.0 control characters} that would
 * otherwise break parsing with {@link SequentialStreamBuilder}.
 *
 * For example, if {@link XmlSanitizerStream} receives a `cp437` encoded chunk of an XML file, that
 * after decoding stringifies to:
 * ```xml
 * <df_world>
 *   <regions>
 *     <region>...</region>
 *     <region>...</region>
 *   </regions>
 * </df_world>
 * ```
 *
 * it transforms it into:
 * ```xml
 *     <region>...</region>
 *     <region>...</region>
 * ```
 *
 * and passes it downstream.
 *
 * Notice that `<df_world>` and `<regions>` wrapper elements have been removed. Their children are emitted
 * as top-level elements themselves rather than remaining nested inside their wrapper element.
 *
 * This is necessary because {@link SequentialStreamBuilder} parses XML incrementally and
 * {@link https://github.com/nodable/flexible-output-builders/tree/main/SequentialStreamBuilder#sequential-stream-output-builder **emits data one top-level element at a time**}.
 *
 * Without flattening these top-level wrapper elements, it would emit, for example, a single JavaScript object
 * containing the entire `<historical_figures>` element content. For large files, that element can wrap tens of
 * thousands of `<historical_figure>` children.
 *
 * Besides significantly increasing memory usage, accumulating such a large wrapper element could cause {@link XmlSanitizerStream}
 * itself to exceed the maximum size of a JavaScript string. Flattening the known wrapper tags allows each child
 * element to be processed independently as it flows through the stream.
 *
 */
export class XmlSanitizerStream extends Transform {
  private decoder: Decoder;

  /**
   * Known wrapper elements in legends files.
   */
  private readonly knownWrapperElements =
    /<\/?(?:df_world|regions|underground_regions|sites|artifacts|historical_figures|entity_populations|entities|historical_events|historical_event_collections|historical_eras|written_contents|poetic_forms|musical_forms|dance_forms|world_constructions)>/g;

  private sanitizer: Sanitizer;

  constructor(
    decoder: Decoder = iconv.decode,
    sanitizer: Sanitizer = stripForbiddenXmlUnicodeCharacters,
  ) {
    super({ readableObjectMode: true, writableObjectMode: true });

    this.decoder = decoder;
    this.sanitizer = sanitizer;
  }

  /**
   * `encoding` param is unused for decoding - functoin body hardcodes it to `cp437` because it's meant to be used only
   * for legends files and we know encoding of those beforehand.
   */
  override _transform(
    ...[chunk, _encoding, callback]: Parameters<Transform["_transform"]>
  ) {
    assert.ok(chunk instanceof Buffer);

    let sanitizedOutput: string;

    try {
      sanitizedOutput = this.sanitizer(
        this.decoder(chunk, "cp437").replace(this.knownWrapperElements, ""),
      );

      callback(null, sanitizedOutput);
    } catch (err) {
      callback(err instanceof Error ? err : new Error(String(err)), null);
    }
  }
}
