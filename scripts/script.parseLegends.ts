import { createReadStream } from "node:fs";
import ora from "ora";

import { LegendsParseOutputBuilderFactory } from "./LegendsParseOutputBuilder";
import { type Script, theme } from "./Script";
import { TypedXmlParser } from "./TypedXmlParser";
import { measureExecutionTime, red, toSeconds, yellow } from "./utils";
import { XmlSanitizerStream } from "./XmlSanitizer";

const exec: Script["exec"] = async ([filepath]) => {
  const spinner = ora();

  const parser = new TypedXmlParser({
    OutputBuilder: new LegendsParseOutputBuilderFactory(),
  });

  spinner.start(theme.style.highlight("Parsing..."));

  const { executionTimeMs, returnValue: result } = await measureExecutionTime(
    () =>
      parser.parseStream(
        createReadStream(filepath).pipe(new XmlSanitizerStream()),
      ),
  );

  spinner.succeed(
    [
      theme.style.highlight(filepath),
      theme.style.message("parsed", "done"),
      theme.style.message("in", "done"),
      theme.style.highlight(toSeconds(executionTimeMs)),
    ].join(" "),
  );

  if (result.warnings) {
    console.log(yellow("\nWarnings:"));
    result.warnings.forEach((warn) => {
      console.warn(yellow(warn));
    });
  }

  if (!result.success) {
    console.log(red("\nErrors:"));
    result.errors.forEach((err) => {
      console.error(err);
    });
  }
};

export const parseLegends: Script = {
  exec,
  helpText: "[r] parse",
  isAvailable: (filename: string) => filename.endsWith(".xml"),
  name: "parse legends",
  triggerKey: "r",
};
