import * as z from "zod";

export const Config = z.object({
  DWARF_FORTRESS_DIR: z.string().min(1),
});

export const config = Config.parse(process.env);
