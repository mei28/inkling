// MutationObserver — watches for DOM changes and decorates new color codes
import { ATTR_INKLING, DEBOUNCE_MS } from "../shared/constants.ts";
import type { DisplayMode } from "../shared/types.ts";
import { scan } from "./scanner.ts";

interface InklingObserver {
  start(): void;
  stop(): void;
}

/** Create a debounced MutationObserver that scans new nodes for color codes. */
export function createObserver(root: Node, mode: DisplayMode): InklingObserver {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingNodes: Set<Node> = new Set();

  function flush() {
    const nodes = pendingNodes;
    pendingNodes = new Set();
    timer = null;

    for (const node of nodes) {
      if (!node.isConnected) continue;
      scan(node, mode);
    }
  }

  function schedule() {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(flush, DEBOUNCE_MS);
  }

  function isOwnMutation(node: Node): boolean {
    if (node instanceof Element && node.hasAttribute(ATTR_INKLING)) return true;
    if (node.parentElement?.closest(`[${ATTR_INKLING}]`)) return true;
    return false;
  }

  const observer = new MutationObserver((mutations) => {
    let dirty = false;

    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const added of mutation.addedNodes) {
          if (isOwnMutation(added)) continue;
          // TreeWalker needs an element root — use parent for Text nodes
          const target = added.nodeType === Node.TEXT_NODE ? added.parentNode : added;
          if (target) {
            pendingNodes.add(target);
            dirty = true;
          }
        }
      } else if (mutation.type === "characterData") {
        const target = mutation.target;
        if (isOwnMutation(target)) continue;
        if (target.parentNode) {
          pendingNodes.add(target.parentNode);
          dirty = true;
        }
      }
    }

    if (dirty) schedule();
  });

  return {
    start() {
      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    },
    stop() {
      observer.disconnect();
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      pendingNodes.clear();
    },
  };
}
