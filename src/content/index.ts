import type { DisplayMode } from "../shared/types.ts";
// Content script entry point
import { scan } from "./scanner.ts";

const mode: DisplayMode = "background";

scan(document.body, mode);
