import ora from "ora";

/**
 * Global instance of spinner.
 */
export const spinner = ora({
  discardStdin: false,
});

export const failSpinnerIfSpinning = (reason?: string) => {
  if (spinner.isSpinning && spinner.isEnabled) {
    spinner.fail(reason);
  }
};
