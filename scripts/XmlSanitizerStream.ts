import type { SequentialStreamBuilder } from "@nodable/sequential-stream-builder";

import iconv from "iconv-lite";
import assert from "node:assert/strict";
import { Transform } from "node:stream";

/**
 * A custom {@link Transform} stream that flattens known DF legends XML wrapper elements, such as:
 *
 * ```xml
 * <df_world>
 * <regions>
 * <underground_regions>
 * <sites>
 * <artifacts>
 * <historical_figures>
 * <entity_populations>
 * <entities>
 * <historical_events>
 * <historical_event_collections>
 * <historical_eras>
 * <written_contents>
 * <poetic_forms>
 * <musical_forms>
 * <dance_forms>
 * <world_constructions>
 * ```
 *
 * It also strips {@link https://www.w3.org/TR/xml/#charsets illegal XML 1.0 control characters} that
 * would otherwise break parsing with {@link SequentialStreamBuilder}
 * (and likely other {@link https://github.com/nodable/flexible-xml-parser `@nodable`} parsers).
 *
 * For example, if {@link XmlSanitizerStream} receives a chunk of an XML file that stringifies to:
 * ```xml
 * <?xml version="1.0" encoding='CP437'?>
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
 * <?xml version="1.0" encoding='CP437'?>
 *     <region>...</region>
 *     <region>...</region>
 * ```
 *
 * and passes it downstream.
 *
 * Notice that `<df_world>` and `<regions>` wrapper elements have been removed. Their children are emitted
 * as top-level elements rather than remaining nested inside their wrapper element.
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
  private readonly encoding: iconv.Encoding;

  /**
   * Regex that matches any Unicode character/code point that is **NOT** in the XML 1.0 allowed-character ranges.
   *
   * @see https://www.w3.org/TR/xml/#charsets
   */
  private readonly illegalXmlChars =
    // eslint-disable-next-line no-control-regex
    /[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu;

  /**
   * Known wrapper elements in DF legends files
   */
  private readonly knownWrapperElements =
    /<\/?(?:df_world|regions|underground_regions|sites|artifacts|historical_figures|entity_populations|entities|historical_events|historical_event_collections|historical_eras|written_contents|poetic_forms|musical_forms|dance_forms|world_constructions)>/g;

  /**
   * TODO: usage will mostly be `new XmlSanitizerStream('cp437')` because it is known beforehand that
   * DF legends files are encoded in `cp437`, if it's ever beneficial consider making the logic
   * read the actual encoding from the XML document and pass it to this class.
   */
  constructor(encoding: iconv.Encoding) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    });

    this.encoding = encoding;
  }

  override _transform(
    ...[chunk, _encoding, callback]: Parameters<Transform["_transform"]>
  ) {
    assert.ok(chunk instanceof Buffer);

    let sanitizedStringifiedChunk: string;

    try {
      sanitizedStringifiedChunk = iconv
        .decode(chunk, this.encoding)
        .replace(this.knownWrapperElements, "")
        .replace(this.illegalXmlChars, "");

      callback(null, sanitizedStringifiedChunk);
    } catch (err) {
      callback(err instanceof Error ? err : new Error(String(err)), null);
    }
  }
}
