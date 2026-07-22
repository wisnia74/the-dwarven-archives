import type { Stats } from "fs";

import { isCancel, log, note, select, text } from "@clack/prompts";
import fs from "fs/promises";
import path from "path";
import z from "zod";

import { __dirname } from "~/dirname";

import { Config } from "./config";
import { type Task, TASK_STATUS } from "./task";
import { cancelTask, trackProgress } from "./utils";
import { bytesToMB, copyFile } from "./utils";

const hint: Task["hint"] =
  "requires correct DWARF_FORTRESS_DIR supplied in tasks/.env, imports to legends/";

const label: Task["label"] =
  "Import legends file from Dwarf Fortress directory";

const run: Task["run"] = async () => {
  try {
    const config = Config.parse(process.env);

    const dirContent = await fs.readdir(config.DWARF_FORTRESS_DIR);
    const files = dirContent
      .filter((x) => x.endsWith(".xml"))
      .map((x) => path.join(config.DWARF_FORTRESS_DIR, x));

    if (!files.length) {
      cancelTask({
        reason: `no legends files found in ${config.DWARF_FORTRESS_DIR}`,
        trigger: "self",
      });
      return TASK_STATUS.CANCELLED;
    }

    const stats = await Promise.all(
      files.map(async (filepath): Promise<[string, Stats]> => [
        filepath,
        await fs.stat(filepath),
      ]),
    );

    const selectedFile = await select({
      message: "Select legends file:",
      options: stats.map(([filepath, stats]) => ({
        hint: `${(stats.size / 1024 / 1024).toFixed(2)}MB, last modified ${new Date(
          stats.mtimeMs,
        ).toLocaleString()}`,
        label: filepath,
        value: filepath,
      })),
    });

    if (isCancel(selectedFile)) {
      cancelTask({ trigger: "user" });
      return TASK_STATUS.CANCELLED;
    }

    note(
      'Not existing directories specified in the filepath will get created\
      \nFiles matching "*.legends.xml" are ignored by git by default',
      "",
      { format: (line) => `- ${line}` },
    );
    const dest = await text({
      initialValue: path.join(
        __dirname,
        "legends",
        path.basename(selectedFile).replace("xml", "legends.xml"),
      ),
      message: "Copy to:",
    });

    if (isCancel(dest)) {
      cancelTask({ trigger: "user" });
      return TASK_STATUS.CANCELLED;
    }

    const destExists = await fs
      .access(dest, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (destExists) {
      cancelTask({ reason: `${dest} already exists`, trigger: "self" });
      return TASK_STATUS.CANCELLED;
    }

    await fs.mkdir(path.dirname(dest), {
      recursive: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { size } = stats.find(([filepath]) => filepath === selectedFile)![1];

    await trackProgress({
      createEndMessage: () =>
        `File copied to ${dest} (${bytesToMB(size).toFixed(2)}MB)`,
      exec: (advanceProgress) =>
        copyFile(selectedFile, dest, (chunk) => {
          advanceProgress(
            chunk.length,
            (currentProgress, maxProgress) =>
              `${bytesToMB(currentProgress).toFixed(2)}/${bytesToMB(maxProgress).toFixed(2)}MB`,
          );
        }),
      maxProgress: size,
    });
  } catch (err) {
    log.error(
      err instanceof z.ZodError ? z.prettifyError(err)
      : err instanceof Error ? err.message
      : String(err),
    );
    cancelTask({ trigger: "error" });
  }
};

export default {
  hint,
  label,
  run,
};
