import type { Stats } from "fs";

import { isCancel, log, select, spinner, text } from "@clack/prompts";
import fs from "fs/promises";
import path from "path";

import { __dirname } from "~/dirname";

import { type Script, SCRIPT_STATUS } from "./script";
import {
  bytesToMB,
  cancelScript,
  gunzip,
  measureTimeTaken,
  msToSeconds,
} from "./utils";

const hint: Script["hint"] = `uses gunzip`;

const label: Script["label"] = "Decompress imported legends file";

const run: Script["run"] = async () => {
  try {
    const dir = path.join(__dirname, "legends");
    const dirContent = await fs.readdir(dir, {
      recursive: true,
    });
    const legendsFiles = dirContent
      .filter((x) => x.endsWith("legends.xml.gz"))
      .map((x) => path.join(__dirname, "legends", x));

    if (!legendsFiles.length) {
      cancelScript({
        reason: `no decompressable legends files found in ${dir}`,
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
      initialValue: selectedFile.filepath.slice(0, -3),
      message: "Decompress to:",
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

    const gunzipProgress = spinner();

    gunzipProgress.start("Decompressing...");

    const { timeTakenMs } = await measureTimeTaken(() =>
      gunzip(selectedFile.filepath, dest),
    );

    const { size: destFileSize } = await fs.stat(dest);

    gunzipProgress.stop(
      `File decompressed to ${dest} in ${msToSeconds(timeTakenMs)} (${bytesToMB(selectedFile.stats.size)} -> ${bytesToMB(destFileSize)})`,
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
