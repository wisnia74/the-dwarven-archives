import type { Stats } from "fs";

import { isCancel, log, select, text } from "@clack/prompts";
import fs, { rm } from "fs/promises";
import path from "path";

import { __dirname } from "~/dirname";

import { type Task, TASK_STATUS } from "./task";
import { cancelTask, trackProgress } from "./utils";
import { bytesToMB, gzip } from "./utils";

const hint: Task["hint"] = `uses gzip`;

const label: Task["label"] = "Compress imported legends file";

const run: Task["run"] = async () => {
  try {
    const dir = path.join(__dirname, "legends");
    const dirContent = await fs.readdir(dir, {
      recursive: true,
    });
    const legendsFiles = dirContent
      .filter((x) => x.endsWith("legends.xml"))
      .map((x) => path.join(__dirname, "legends", x));

    if (!legendsFiles.length) {
      cancelTask({
        reason: `no compressable legends files found in ${dir}`,
        trigger: "self",
      });
      return TASK_STATUS.CANCELLED;
    }

    const stats = await Promise.all(
      legendsFiles.map(async (filepath): Promise<[string, Stats]> => [
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

    const dest = await text({
      initialValue: selectedFile.concat(".gz"),
      message: "Compress to:",
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
      createEndMessage: async () => {
        const { size: destFileSize } = await fs.stat(dest);

        return `File compressed to ${dest} (${bytesToMB(size).toFixed(2)}MB -> ${bytesToMB(destFileSize).toFixed(2)}MB)`;
      },
      exec: async (advanceProgress) =>
        gzip(selectedFile, dest, (chunk) => {
          advanceProgress(
            chunk.length,
            (currentProgress, maxProgress) =>
              `${bytesToMB(currentProgress).toFixed(2)}/${bytesToMB(maxProgress).toFixed(2)}MB`,
          );
        }),
      maxProgress: size,
    });

    await rm(selectedFile);
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
    cancelTask({ trigger: "error" });
  }
};

export default {
  hint,
  label,
  run,
};
