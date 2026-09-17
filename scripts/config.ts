if (!process.env.DWARF_FORTRESS_DIR) {
  throw new Error(
    "Missing environment variable: DWARF_FORTRESS_DIR, check scripts/.env",
  );
}

if (typeof process.env.DWARF_FORTRESS_DIR !== "string") {
  throw new Error(
    `Invalid type of environment variable DWARF_FORTRESS_DIR: expected string, received ${typeof process.env.DWARF_FORTRESS_DIR}`,
  );
}

export const config = {
  DWARF_FORTRESS_DIR: process.env.DWARF_FORTRESS_DIR,
};
