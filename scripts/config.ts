import * as z from "zod";

export const Config = z.object({
  DWARF_FORTRESS_DIR: z.string(),
});

export const getConfig = async (): Promise<z.infer<typeof Config>> => {
  try {
    return await Config.parseAsync(process.env);
  } catch (err) {
    throw new Error(
      err instanceof z.ZodError ? z.prettifyError(err) : String(err),
      { cause: err },
    );
  }
};
