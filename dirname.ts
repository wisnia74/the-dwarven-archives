import path from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const LIB_DIR = path.join(__dirname, "lib");
export const SCHEMA_DIR = path.join(__dirname, "schema");
export const TEMP_DIR = path.join(__dirname, "temp");
