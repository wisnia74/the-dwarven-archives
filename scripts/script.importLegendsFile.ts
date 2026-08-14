import type { Stats } from "fs";

import { isCancel, log, select, spinner, text } from "@clack/prompts";
import fs from "fs/promises";
import path from "path";
import z from "zod";

import { __dirname } from "~/dirname";

import { Config } from "./config";
import { type Script, SCRIPT_STATUS } from "./script";
import {
  bytesToMB,
  cancelScript,
  copyFile,
  measureTimeTaken,
  msToSeconds,
} from "./utils";

const hint: Script["hint"] =
  "requires correct DWARF_FORTRESS_DIR supplied in scripts/.env";

const label: Script["label"] =
  "Import legends file from Dwarf Fortress directory";

const run: Script["run"] = async () => {
  const copyProgress = spinner();

  try {
    const config = Config.parse(process.env);

    const dirContent = await fs.readdir(config.DWARF_FORTRESS_DIR);
    const files = dirContent
      .filter((x) => x.endsWith(".xml"))
      .map((x) => path.join(config.DWARF_FORTRESS_DIR, x));

    if (!files.length) {
      cancelScript({
        reason: `no legends files found in ${config.DWARF_FORTRESS_DIR}`,
        trigger: "self",
      });
      return SCRIPT_STATUS.CANCELLED;
    }

    const stats = await Promise.all(
      files.map(async (filepath): Promise<[string, Stats]> => [
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
      initialValue: path.join(
        __dirname,
        "legends",
        path.basename(selectedFile.filepath).replace("xml", "legends.xml"),
      ),
      message: "Copy to:",
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

    copyProgress.start("Copying...");

    const { timeTakenMs } = await measureTimeTaken(() =>
      copyFile(selectedFile.filepath, dest),
    );

    copyProgress.stop(
      `File copied to ${dest} (${bytesToMB(selectedFile.stats.size)}) in ${msToSeconds(timeTakenMs)}`,
    );
  } catch (err) {
    copyProgress.cancel();
    log.error(
      err instanceof z.ZodError ? z.prettifyError(err)
      : err instanceof Error ? err.message
      : String(err),
    );
    cancelScript({ trigger: "error" });
  }
};

export default {
  hint,
  label,
  run,
};
