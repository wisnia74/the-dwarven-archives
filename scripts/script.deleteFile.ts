import { confirm } from "@inquirer/prompts";
import fs from "fs/promises";
import { type Stats } from "node:fs";
import ora from "ora";

import { theme } from "./components";

export const deleteFile = async ([filepath]: [string, Stats]) => {
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
