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
