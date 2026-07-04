import { cancel, progress, type ProgressOptions } from "@clack/prompts";

export const TASK_STATUS = {
  CANCELLED: "CANCELLED",
} as const;

export interface Task {
  hint?: string;
  label: string;
  run: () =>
    | keyof typeof TASK_STATUS
    | Promise<keyof typeof TASK_STATUS | undefined>
    | undefined;
}

export const userCancelsTask = () => {
  cancel(`Task cancelled by the user`);
};

export const taskCancelsItself = (reason: string) => {
  cancel(`Task cancelled - ${reason}`);
};

type AdvanceProgressCallback = (
  delta: number,
  createLabel: (currentProgress: number, maxProgress: number) => string,
) => void;

export const measureProgress = async ({
  endMessage,
  exec,
  maxProgress,
  progressOpts,
  startMessage,
}: {
  endMessage?: string;
  exec: (advanceProgress: AdvanceProgressCallback) => Promise<void> | void;
  maxProgress: number;
  progressOpts?: ProgressOptions;
  startMessage?: string;
}) => {
  let currentProgress = 0;

  const prog = progress({ ...progressOpts, max: maxProgress });

  prog.start(startMessage);

  await exec((delta, createLabel) => {
    currentProgress += delta;

    prog.advance(delta, createLabel(currentProgress, maxProgress));
  });

  prog.stop(endMessage);
};
