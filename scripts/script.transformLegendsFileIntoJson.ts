import { autocomplete, isCancel, spinner, text } from "@clack/prompts";
import XMLParser from "@nodable/flexible-xml-parser";
import { SequentialStreamBuilderFactory } from "@nodable/sequential-stream-builder";
import { createReadStream, createWriteStream, type Stats } from "fs";
import fs from "fs/promises";
import path from "path";

import { __dirname } from "~/dirname";

import { type Script, SCRIPT_STATUS } from "./script";
import {
  bytesToMB,
  cancelScript,
  measureTimeTaken,
  msToSeconds,
} from "./utils";
import { XmlSanitizerStream } from "./XmlSanitizerStream";

const hint: Script["hint"] = "";

const label: Script["label"] =
  "Transform imported legends file into JSON schema";

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
    initialValue: selectedFile.filepath.slice(0, -3).concat("json"),
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

  const output = createWriteStream(dest, { encoding: "utf-8" });

  const parser = new XMLParser({
    OutputBuilder: new SequentialStreamBuilderFactory({
      space: 2,
      stream: output,
    }),
    skip: {
      declaration: true,
    },
  });

  const transformProgress = spinner();
  transformProgress.start("Transforming...");

  try {
    const { timeTakenMs } = await measureTimeTaken(() =>
      parser.parseStream(
        createReadStream(selectedFile.filepath).pipe(
          new XmlSanitizerStream("cp437"),
        ),
      ),
    );

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
};
