import type * as inquirer from "@inquirer/prompts";
import type ora from "ora";

import { red } from "./utils";

/**
 * Handle uncaught errors gracefully (mostly for {@link inquirer}), rethrow unknown errors.
 */
const handleUncaughtErrors = (error: unknown) => {
  if (!(error instanceof Error && error.name === "ExitPromptError")) {
    console.error(
      red(
        error instanceof Error ? (error.stack ?? error.message) : String(error),
      ),
    );
    process.exit(1);
  }
};

process.on("uncaughtException", handleUncaughtErrors);
process.on("unhandledRejection", handleUncaughtErrors);

/**
 * Handle Unix signals gracefully (mostly for {@link ora}) and exit the process.
 */
const handleUnixSignals = (exitCode: number) => {
  process.exit(exitCode);
};

process.on("SIGINT", () => handleUnixSignals(0));
process.on("SIGTERM", () => handleUnixSignals(143));
