import type { Stats } from "node:fs";

import {
  createPrompt,
  isDownKey,
  isUpKey,
  type Status,
  type Theme,
  useKeypress,
  usePagination,
  usePrefix,
  useState,
} from "@inquirer/core";

import type { Script } from "./Script";

import { toMb } from "./utils";

interface ScriptPromptConfig {
  files: [string, Stats][];
  message: string;
  scripts: Script[];
  theme: Theme;
}

type ScriptPromptAnswer = {
  exec: Script["exec"];
  file: [string, Stats];
} | null;

export const dynamicScriptSelect = createPrompt<
  ScriptPromptAnswer,
  ScriptPromptConfig
>((config, done) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [status, setStatus] = useState<Status>(
    config.files.length === 0 ? "done" : "idle",
  );

  const prefix = usePrefix({ status, theme: config.theme });

  if (status === "done" && config.files.length === 0) {
    done(null);

    return `${prefix} ${config.theme.style.help("No files available")}`;
  }

  const [selectedScript, setSelectedScript] = useState<null | Script>(null);
  const selectedFile = config.files[activeFileIndex];

  if (status === "done" && !!selectedScript) {
    done({
      exec: selectedScript.exec,
      file: selectedFile,
    });

    return [
      prefix,
      `${config.theme.style.message(`Selected file: ${config.theme.style.highlight(selectedFile[0])}`, status)},`,
      `selected script: ${config.theme.style.highlight(selectedScript.name)}`,
    ].join(" ");
  }

  const availableActions = config.scripts.filter((action) =>
    action.isAvailable(selectedFile[0]),
  );

  useKeypress((key) => {
    if (isUpKey(key)) {
      setActiveFileIndex((current) =>
        current === 0 ? config.files.length - 1 : current - 1,
      );

      return;
    }

    if (isDownKey(key)) {
      setActiveFileIndex((current) => (current + 1) % config.files.length);

      return;
    }

    const matchedScript = availableActions.find(
      (s) => s.triggerKey === key.name,
    );

    if (!matchedScript) {
      return;
    }

    setStatus("done");
    setSelectedScript(matchedScript);
  });

  const helpText = config.theme.style.help(
    [
      `↑↓ navigate`,
      ...availableActions.map(({ helpText: helpName }) => helpName),
    ].join(" • "),
  );

  const page = usePagination({
    active: activeFileIndex,
    items: config.files,
    loop: true,
    pageSize: 15,
    renderItem: ({ index, isActive, item: [filepath, stats] }) => {
      const cursor = isActive ? "❯" : " ";
      const name = isActive ? config.theme.style.highlight(filepath) : filepath;

      return `${cursor} ${(index + 1).toString()}. ${name} ${config.theme.style.help(
        `(${toMb(stats.size)}, last modified ${new Date(
          stats.mtimeMs,
        ).toLocaleString()})`,
      )}`;
    },
  });

  return [
    `${prefix} ${config.theme.style.message(config.message, status)}`,
    page,
    `\n${helpText}`,
  ].join("\n");
});
