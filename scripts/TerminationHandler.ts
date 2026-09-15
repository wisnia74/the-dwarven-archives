import type * as inquirer from "@inquirer/prompts";
import type ora from "ora";

import { failSpinnerIfSpinning } from "./spinner";
import { red } from "./utils";

/**
 * Handle uncaught errors gracefully for {@link inquirer}, rethrow unknown errors.
 */
const handleUncaughtErrors = (error: unknown) => {
  failSpinnerIfSpinning("Error");

  if (error instanceof Error && error.name === "ExitPromptError") {
    console.log(red("Script terminated"));
  } else {
    throw error;
  }
};

process.on("uncaughtException", handleUncaughtErrors);
process.on("unhandledRejection", handleUncaughtErrors);

/**
 * Handle Unix signals gracefully for {@link ora} and exit the process.
 */
const handleUnixSignals = (exitCode: number) => {
  failSpinnerIfSpinning(red("Script terminated"));
  process.exit(exitCode);
};

process.on("SIGINT", () => handleUnixSignals(0));
process.on("SIGTERM", () => handleUnixSignals(143));
