import { autocomplete, isCancel, spinner, text } from "@clack/prompts";
import XMLParser from "@nodable/flexible-xml-parser";
import { createReadStream, type Stats } from "fs";
import fs from "fs/promises";
import path from "path";

import { __dirname } from "~/dirname";

import { SchemaBuilderFactory } from "./SchemaBuilder";
import { type Script, SCRIPT_STATUS } from "./script";
import {
  bytesToMB,
  cancelScript,
  measureTimeTaken,
  msToSeconds,
} from "./utils";
import { XmlSanitizerStream } from "./XmlSanitizer";

const hint: Script["hint"] = "test";

const label: Script["label"] = "Transform imported legends file into schema";

const run: Script["run"] = async () => {
  const dir = path.join(__dirname, "legends");
  const dirContent = await fs.readdir(dir, {
    recursive: true,
  });
  const legendsFiles = dirContent
    .filter((x) => x.endsWith("legends.xml"))
    .map((x) => path.join(__dirname, "legends", x));

  if (!legendsFiles.length) {
    cancelScript({
      reason: `no transformable legends files found in ${dir}`,
      trigger: "self",
    });
    return SCRIPT_STATUS.CANCELLED;
  }

  const stats = await Promise.all(
    legendsFiles.map(async (filepath): Promise<[string, Stats]> => [
      filepath,
      await fs.stat(filepath),
    ]),
  );

  const selectedFile = await autocomplete({
    message: "Select file:",
    options: stats
      .sort(([, aStats], [, bStats]) => bStats.mtimeMs - aStats.mtimeMs)
      .map(([filepath, stats]) => ({
        hint: `${bytesToMB(stats.size)}, last modified ${new Date(
          stats.mtimeMs,
        ).toLocaleString()}`,
        label: filepath,
        value: { filepath, stats },
      })),
  });

  if (isCancel(selectedFile)) {
    cancelScript({ trigger: "user" });
    return SCRIPT_STATUS.CANCELLED;
  }

  const dest = await text({
    initialValue: selectedFile.filepath.slice(0, -3).concat("schema.json"),
    message: "Transform to:",
  });

  if (isCancel(dest)) {
    cancelScript({ trigger: "user" });
    return SCRIPT_STATUS.CANCELLED;
  }

  const destExists = await fs
    .access(dest, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

  if (destExists) {
    cancelScript({ reason: `${dest} already exists`, trigger: "self" });
    return SCRIPT_STATUS.CANCELLED;
  }

  await fs.mkdir(path.dirname(dest), {
    recursive: true,
  });

  const parser = new XMLParser({
    OutputBuilder: new SchemaBuilderFactory({}),
    skip: {
      declaration: true,
    },
  });

  const transformProgress = spinner();
  transformProgress.start("Transforming...");

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { result, timeTakenMs } = await measureTimeTaken(() =>
      parser.parseStream(
        createReadStream(selectedFile.filepath).pipe(new XmlSanitizerStream()),
      ),
    );

    await fs.writeFile(dest, result as string);

    const { size: destFileSize } = await fs.stat(dest);

    transformProgress.stop(
      `File transformed to ${dest} (${bytesToMB(destFileSize)}) in ${msToSeconds(timeTakenMs)}`,
    );
  } catch (err) {
    transformProgress.cancel(err instanceof Error ? err.message : String(err));
    cancelScript({ trigger: "error" });
    return SCRIPT_STATUS.CANCELLED;
  }
};

export default {
  hint,
  label,
  run,
} as Script;
