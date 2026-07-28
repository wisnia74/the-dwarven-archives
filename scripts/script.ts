export const SCRIPT_STATUS = {
  CANCELLED: "CANCELLED",
} as const;

export interface Script {
  hint?: string;
  label: string;
  run: () =>
    | keyof typeof SCRIPT_STATUS
    | Promise<keyof typeof SCRIPT_STATUS | undefined>
    | undefined;
}
