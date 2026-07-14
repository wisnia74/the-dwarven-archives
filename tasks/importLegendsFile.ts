import { isCancel, log, note, select, text } from "@clack/prompts";
import { type Stats } from "fs";
import fs from "fs/promises";
import path from "path";

import { __dirname } from "~/dirname";
import { bytesToMB, copyFile } from "~/utils/files";

import { Config } from "./config";
import {
  type Task,
  TASK_STATUS,
  taskCancelsItself,
  trackProgress,
  userCancelsTask,
} from "./task";

const hint: Task["hint"] =
  "Requires DWARF_FORTRESS_DIR supplied in scripts/.env";

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
      taskCancelsItself(
        `no legends files found in ${config.DWARF_FORTRESS_DIR}`,
      );
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
      userCancelsTask();
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
      message: "Copy as:",
    });

    if (isCancel(dest)) {
      userCancelsTask();
      return TASK_STATUS.CANCELLED;
    }

    const destExists = await fs
      .access(dest, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (destExists) {
      taskCancelsItself(`${dest} already exists`);
      return TASK_STATUS.CANCELLED;
    }

    // if dirname exists this is a no-op, but it doesn't throw
    await fs.mkdir(path.dirname(dest), {
      recursive: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { size } = stats.find(([filepath]) => filepath === selectedFile)![1];

    await trackProgress({
      createEndMessage: () =>
        `File copied as ${dest} (${bytesToMB(size).toFixed(2)}MB)`,
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
    log.error(err instanceof Error ? err.message : JSON.stringify(err));
    taskCancelsItself("error");
  }
};

export default {
  hint,
  label,
  run,
};
