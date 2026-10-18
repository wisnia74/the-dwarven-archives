import * as z from "zod";
import { createErrorMap } from "zod-validation-error";

z.config({
  customError: createErrorMap({ reportInput: "typeAndValue" }),
});

export * from "./region.schema";
export * from "./undergroundRegion.schema";
