import type { Stats } from "fs";

import { isCancel, log, select, spinner, text } from "@clack/prompts";
import fs from "fs/promises";
import path from "path";

import { __dirname } from "~/dirname";

import { type Script, SCRIPT_STATUS } from "./script";
import {
  bytesToMB,
  cancelScript,
  gzip,
  measureTimeTaken,
  msToSeconds,
} from "./utils";

const hint: Script["hint"] = `uses gzip`;

const label: Script["label"] = "Compress imported legends file";

const run: Script["run"] = async () => {
  const gzipProgress = spinner();

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
        reason: `no compressable legends files found in ${dir}`,
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
      initialValue: selectedFile.filepath.concat(".gz"),
      message: "Compress to:",
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

    gzipProgress.start("Compressing...");

    const { timeTakenMs } = await measureTimeTaken(() =>
      gzip(selectedFile.filepath, dest),
    );

    const { size: destFileSize } = await fs.stat(dest);

    gzipProgress.stop(
      `File compressed to ${dest} in ${msToSeconds(timeTakenMs)} (${bytesToMB(selectedFile.stats.size)} -> ${bytesToMB(destFileSize)})`,
    );
  } catch (err) {
    gzipProgress.cancel();
    log.error(err instanceof Error ? err.message : String(err));
    cancelScript({ trigger: "error" });
  }
};

export default {
  hint,
  label,
  run,
};
