import { intro, isCancel, log, note, outro, select } from "@clack/prompts";

import compressLegendsFile from "./compressLegendsFile";
import decompressLegendsFile from "./decompressLegendsFile";
import importLegendsFile from "./importLegendsFile";
import { type Task, TASK_STATUS } from "./task";

const tasks: Record<string, Task> = {
  compressLegendsFile,
  decompressLegendsFile,
  importLegendsFile,
};

const taskList = async (timesExecuted = 1) => {
  intro(timesExecuted > 1 ? "Choose another task:" : "Task list");

  if (timesExecuted === 2) {
    note("Press Ctrl+C, Ctrl+D or ESC to exit");
  }

  const selectedTask = await select({
    message: "Select task:",
    options: Object.entries(tasks).map(([key, task]) => ({
      hint: task.hint,
      label: task.label,
      value: key,
    })),
  });

  if (isCancel(selectedTask)) {
    log.info("Exiting...");
    process.exit(0);
  }

  const result = await tasks[selectedTask].run();

  if (result !== TASK_STATUS.CANCELLED) {
    outro("Task finished");
  }

  return taskList(timesExecuted + 1);
};

void taskList();
