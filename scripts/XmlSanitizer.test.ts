import { describe, expect, it, vi } from "vitest";

import {
  type Decoder,
  type Sanitizer,
  stripForbiddenXmlUnicodeCharacters,
  XmlSanitizerStream,
} from "./XmlSanitizer";

describe("stripForbiddenXmlUnicodeCharacters", () => {
  it("strips any forbidden XML 1.0 Unicode characters from the input string", () => {
    const range = (start: number, end: number): number[] => {
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    /**
     * Array of `["\x00", "\x01", "\x02", "\x03", "\x04", "\x05", ...]` Unicode characters (over 2,000 elements).
     */
    const forbiddenXmlUnicodeCharacters = [
      ...range(0x0000, 0x0008),
      ...range(0x000b, 0x000c),
      ...range(0x000e, 0x001f),
      ...range(0xd800, 0xdfff),
      ...range(0xfffe, 0xffff),
    ].map((codePoint) => String.fromCodePoint(codePoint));

    // Check whether Unicode character gets stripped if it's the only forbidden one inside the input string.
    for (const char of forbiddenXmlUnicodeCharacters) {
      expect(
        stripForbiddenXmlUnicodeCharacters(char),
        `U+${char.toUpperCase().padStart(4, "0")} was not removed`,
      ).toStrictEqual("");
    }

    /**
     * Check whether all forbidden Unicode characters get stripped if they're all inside the input string.
     *
     * We join forbidden Unicode characters with a `.join("|")` delimiter instead of `.join("")`, because certain
     * Unicode characters represent valid astral Unicode characters when they are right next to each other.
     *
     * For example:
     * ```plain
     * \uD800\uDC00
     * ```
     *
     * Represents:
     * ```plain
     * U+10000
     * ```
     *
     * If we didn't use a delimiter, certain Unicode characters woldn't get stripped because they're not
     * within the range we use to check for forbidden Unicode characters. That's why we use a delimiter,
     * call the function, then expect the result to contain only the delimiter character, repeated
     * as many times as there were Unicode characters inside the input string.
     */
    expect(
      stripForbiddenXmlUnicodeCharacters(
        forbiddenXmlUnicodeCharacters.join("|"),
      ),
    ).toStrictEqual("|".repeat(forbiddenXmlUnicodeCharacters.length - 1));
  });

  it("preserves every XML 1.0 boundary character", () => {
    const xmlBoundaryUnicodeCharacters = [
      0x0009, 0x000a, 0x000d, 0x0020, 0xd7ff, 0xe000, 0xfffd, 0x10000, 0x10ffff,
    ].map((codePoint) => String.fromCodePoint(codePoint));

    // Check whether XML boundary Unicode character gets preserved if it's the only one inside the input string.
    for (const char of xmlBoundaryUnicodeCharacters) {
      expect(
        stripForbiddenXmlUnicodeCharacters(char),
        `U+${char.toUpperCase().padStart(4, "0")} was not removed`,
      ).toStrictEqual(char);
    }

    // Check whether all XML boundary Unicode characters gets preserved if they're all inside the input string.
    expect(
      stripForbiddenXmlUnicodeCharacters(xmlBoundaryUnicodeCharacters.join("")),
    ).toStrictEqual(xmlBoundaryUnicodeCharacters.join(""));
  });
});

describe("XmlSanitizerStream", () => {
  it("flattens any known legends file top-level wrapper elements so that their children become top-level elements themselves", () => {
    const mockDecoder = vi.fn<Decoder>((chunk) => chunk.toString());
    const mockSanitizer = vi.fn<Sanitizer>((str) => str);

    const stream = new XmlSanitizerStream(mockDecoder, mockSanitizer);
    const buffer = Buffer.from(`
        <df_world>
          <regions><a>1</a></regions>
          <underground_regions><b>2</b></underground_regions>
          <sites><c>3</c></sites>
          <artifacts><d>4</d></artifacts>
          <historical_figures><e>5</e></historical_figures>
          <entity_populations><f>6</f></entity_populations>
          <entities><g>7</g></entities>
          <historical_events><h>8</h></historical_events>
          <historical_event_collections><i>9</i></historical_event_collections>
          <historical_eras><j>10</j></historical_eras>
          <written_contents><k>11</k></written_contents>
          <poetic_forms><l>12</l></poetic_forms>
          <musical_forms><m>13</m></musical_forms>
          <dance_forms><n>14</n></dance_forms>
          <world_constructions><o>15</o></world_constructions>
        </df_world>`);

    stream.write(buffer);

    const result = stream.read();

    expect(mockDecoder).toHaveBeenCalledTimes(1);
    expect(mockDecoder).toHaveBeenCalledWith(buffer, "cp437");
    expect(mockSanitizer).toHaveBeenCalledTimes(1);
    expect(mockSanitizer).toHaveBeenCalledWith(`
        
          <a>1</a>
          <b>2</b>
          <c>3</c>
          <d>4</d>
          <e>5</e>
          <f>6</f>
          <g>7</g>
          <h>8</h>
          <i>9</i>
          <j>10</j>
          <k>11</k>
          <l>12</l>
          <m>13</m>
          <n>14</n>
          <o>15</o>
        `);
    expect(result).toBe(`
        
          <a>1</a>
          <b>2</b>
          <c>3</c>
          <d>4</d>
          <e>5</e>
          <f>6</f>
          <g>7</g>
          <h>8</h>
          <i>9</i>
          <j>10</j>
          <k>11</k>
          <l>12</l>
          <m>13</m>
          <n>14</n>
          <o>15</o>
        `);
  });
});
