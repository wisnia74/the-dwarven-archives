import * as z from "zod";

export const undergroundRegionSchema = z.object({
  depth: z.coerce.number().nonnegative(),
  id: z.coerce.number().nonnegative(),
  type: z.enum(["cavern", "magma", "underworld"]),
});
