import { cancel, progress } from "@clack/prompts";

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

export const trackProgress = async <T>({
  createEndMessage,
  exec,
  maxProgress,
}: {
  createEndMessage: () => Promise<string> | string;
  exec: (advanceProgress: AdvanceProgressCallback) => Promise<T>;
  maxProgress: number;
}): Promise<T> => {
  let currentProgress = 0;

  const prog = progress({
    indicator: "timer",
    max: maxProgress,
    style: "block",
  });

  prog.start();

  const result = await exec((delta, createLabel) => {
    currentProgress += delta;

    prog.advance(delta, createLabel(currentProgress, maxProgress));
  });

  prog.stop(await createEndMessage());

  return result;
};
