import { confirm } from "@inquirer/prompts";
import fs from "fs/promises";
import ora from "ora";

import type { Script } from "./Script";

import { theme } from "./dynamicScriptSelect";

const exec: Script["exec"] = async ([filepath]) => {
  const spinner = ora();

  const confirmation = await confirm({
    default: true,
    message: "Are you sure?",
  });

  if (!confirmation) {
    return;
  }

  spinner.start(theme.style.highlight("Deleting..."));

  await fs.rm(filepath);

  spinner.succeed(
    [
      theme.style.highlight(filepath),
      theme.style.message("deleted", "done"),
    ].join(" "),
  );
};

export const deleteFile = {
  exec,
  helpText: `[x] delete`,
  isAvailable: () => true,
  name: "delete file",
  triggerKey: "x",
};
