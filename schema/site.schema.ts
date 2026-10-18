import * as z from "zod";

export const siteSchema = z.strictObject({
  coords: z
    .string()
    .regex(/^\d+,\d+$/)
    .transform((value) => value as `${number},${number}`),
  id: z.coerce.number().nonnegative(),
  name: z.string(),
  rectangle: z
    .string()
    .regex(/^\d+,\d+:\d+,\d+$/)
    .transform((value) => value as `${number},${number}:${number},${number}`),
  // siteProperties: z.array(
  //   z.object({
  //     id: z.coerce.number().nonnegative(),
  //     ownerHfid: z.coerce.number().nonnegative(),
  //   }),
  // ),
  // structures: z.array(
  //   z.object({
  //     localId: z.coerce.number().nonnegative(),
  //     name: z.string(),
  //   }),
  // ),
  type: z.enum([
    "camp",
    "castle",
    "cave",
    "counting house",
    "dark pits",
    "dungeon",
    "forest retreat",
    "fort",
    "guildhall",
    "hamlet",
    "hillocks",
    "house",
    "inn tavern",
    "keep",
    "labyrinth",
    "lair",
    "market",
    "mead hall",
    "mountain halls",
    "mysterious dungeon",
    "mysterious lair",
    "mysterious palace",
    "shrine",
    "temple",
    "tomb",
    "tower",
    "vault",
  ]),
});
