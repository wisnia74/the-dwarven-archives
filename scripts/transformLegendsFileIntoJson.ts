import { isCancel, log, select, spinner, text } from "@clack/prompts";
import XMLParser from "@nodable/flexible-xml-parser";
import { createReadStream, type Stats } from "fs";
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
  try {
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

    const selectedFile = await select({
      message: "Select file:",
      options: stats.map(([filepath, stats]) => ({
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

    const parser = new XMLParser({
      skip: {
        declaration: true,
      },
    });

    const transformProgress = spinner();

    transformProgress.start("Transforming...");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { result, timeTakenMs } = await measureTimeTaken(() =>
      parser.parseStream(
        createReadStream(selectedFile.filepath).pipe(
          new XmlSanitizerStream("cp437"),
        ),
      ),
    );

    await fs.writeFile(dest, JSON.stringify(result, null, 2));

    transformProgress.stop(
      `File transformed to ${dest} (${bytesToMB(selectedFile.stats.size)}) in ${msToSeconds(timeTakenMs)}`,
    );
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
    cancelScript({ trigger: "error" });
  }
};

export default {
  hint,
  label,
  run,
};
