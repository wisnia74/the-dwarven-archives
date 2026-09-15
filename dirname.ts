import path from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const TEMP_DIR = path.join(__dirname, "temp");
