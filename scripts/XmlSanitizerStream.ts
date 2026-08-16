import iconv from "iconv-lite";
import { Transform, type TransformCallback } from "stream";

/**
 * Custom Transform Stream to strip top level tags like:
 *
 * ```
 * <df_world>
 * <regions>
 * <underground_regions>
 * <sites>
 * <world_constructions>
 * <artifacts>
 * <historical_figures>
 * <entity_populations>
 * <entities>
 * <historical_events>
 * <historical_event_collections>
 * <written_contents>
 * <dance_forms>
 * ```
 *
 * from DF legends file and illegal XML 1.0 control characters
 */
export class XmlSanitizerStream extends Transform {
  protected encoding: iconv.Encoding;

  private readonly illegalXmlChars =
    // eslint-disable-next-line no-control-regex
    /[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g;

  constructor(encoding: iconv.Encoding) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    });

    this.encoding = encoding;
  }

  _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    callback(
      null,
      iconv
        .decode(chunk, this.encoding)
        .replace(
          /<\/?(?:df_world|regions|underground_regions|sites|world_constructions|artifacts|historical_figures|entity_populations|entities|historical_events|historical_event_collections|written_contents|dance_forms)>/g,
          "",
        )
        .replace(this.illegalXmlChars, ""),
    );
  }
}
