import * as z from "zod";

export const regionSchema = z.strictObject({
  id: z.coerce.number().nonnegative(),
  name: z.string(),
  type: z.enum([
    "Desert",
    "Forest",
    "Glacier",
    "Grassland",
    "Hills",
    "Lake",
    "Mountains",
    "Ocean",
    "Tundra",
    "Wetland",
  ]),
});
