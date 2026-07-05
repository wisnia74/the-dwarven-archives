import { isCancel, log, note, type Option, select, text } from "@clack/prompts";
import { type Stats } from "fs";
import fs from "fs/promises";
import path from "path";

import { __dirname } from "~/dirname";
import { copyFile } from "~/utils/copyFile";

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
    const legendsFiles = dirContent.filter((x) => x.endsWith(".xml"));

    if (!legendsFiles.length) {
      taskCancelsItself(
        `no legends files found in ${config.DWARF_FORTRESS_DIR}`,
      );
      return TASK_STATUS.CANCELLED;
    }

    const legendsFilesStats = await Promise.all(
      legendsFiles.map(async (filename): Promise<[string, Stats]> => {
        const filepath = path.join(config.DWARF_FORTRESS_DIR, filename);
        return [filepath, await fs.stat(filepath)];
      }),
    );

    const selectedLegendsFile = await select({
      message: "Select legends file:",
      options: legendsFilesStats.map<Option<string>>(([filepath, stats]) => ({
        hint: `${(stats.size / 1024 / 1024).toFixed(2)}MB, last modified ${new Date(
          stats.mtimeMs,
        ).toLocaleString()}`,
        label: filepath,
        value: filepath,
      })),
    });

    if (isCancel(selectedLegendsFile)) {
      userCancelsTask();
      return TASK_STATUS.CANCELLED;
    }

    note(
      '1. Not existing directories specified in filepath will get created\n\
      2. Files ending with ".legends.xml" are gitignored by default',
    );
    const destFilepath = await text({
      initialValue: path.join(
        __dirname,
        "legends",
        path.basename(selectedLegendsFile).replace("xml", "legends.xml"),
      ),
      message: "Destination filepath:",
    });

    if (isCancel(destFilepath)) {
      userCancelsTask();
      return TASK_STATUS.CANCELLED;
    }

    const fileExists = await fs
      .access(destFilepath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (fileExists) {
      taskCancelsItself(`${destFilepath} already exists`);
      return TASK_STATUS.CANCELLED;
    }

    // if dirname exists this is a no-op, but it doesn't throw
    await fs.mkdir(path.dirname(destFilepath), {
      recursive: true,
    });

    // selectedLegendsFile comes from legendsFilesStats so .find() is always truthy here
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const selectedLegendsFileStats = legendsFilesStats.find(
      ([filepath]) => filepath === selectedLegendsFile,
    )![1];
    const fileSizeMb = selectedLegendsFileStats.size / 1024 / 1024;

    await trackProgress({
      endMessage: `File copied to ${destFilepath} (${fileSizeMb.toFixed(2)}MB)`,
      exec: async (advanceProgress) => {
        await copyFile(selectedLegendsFile, destFilepath, (chunk) => {
          advanceProgress(
            chunk.length / 1024 / 1024,
            (currentProgress, maxProgress) =>
              `${currentProgress.toFixed(2)}/${maxProgress.toFixed(2)}MB`,
          );
        });
      },
      maxProgress: fileSizeMb,
      progressOpts: {
        style: "block",
      },
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
