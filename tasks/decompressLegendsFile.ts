import type { Stats } from "fs";

import { isCancel, log, note, select, text } from "@clack/prompts";
import fs from "fs/promises";
import path from "path";

import { __dirname } from "~/dirname";
import { bytesToMB, gunzip } from "~/utils/files";

import {
  type Task,
  TASK_STATUS,
  taskCancelsItself,
  trackProgress,
  userCancelsTask,
} from "./task";

const hint: Task["hint"] = `Decompresses a single "*.legends.xml.gz" file from ${path.join(__dirname, "legends")}`;

const label: Task["label"] = "Decompress imported legends file";

const run: Task["run"] = async () => {
  try {
    const dir = path.join(__dirname, "legends");
    const dirContent = await fs.readdir(dir, {
      recursive: true,
    });
    const legendsFiles = dirContent
      .filter((x) => x.endsWith("legends.xml.gz"))
      .map((x) => path.join(__dirname, "legends", x));

    if (!legendsFiles.length) {
      taskCancelsItself(`no decompressable legends files found in ${dir}`);
      return TASK_STATUS.CANCELLED;
    }

    const stats = await Promise.all(
      legendsFiles.map(async (filepath): Promise<[string, Stats]> => [
        filepath,
        await fs.stat(filepath),
      ]),
    );

    const selectedFile = await select({
      message: "Select compressed legends file:",
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
      initialValue: selectedFile.slice(0, -3),
      message: "Decompress as:",
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
      createEndMessage: async () => {
        const { size: destFileSize } = await fs.stat(dest);

        return `File decompressed as ${dest} (${bytesToMB(size).toFixed(2)}MB -> ${bytesToMB(destFileSize).toFixed(2)}MB)`;
      },
      exec: async (advanceProgress) =>
        gunzip(selectedFile, dest, (chunk) => {
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
