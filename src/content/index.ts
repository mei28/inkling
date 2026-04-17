// Content script entry point
import type { DisplayMode } from "../shared/types.ts";
import { createObserver } from "./observer.ts";
import { scan } from "./scanner.ts";

const mode: DisplayMode = "background";

scan(document.body, mode);

const observer = createObserver(document.body, mode);
observer.start();
