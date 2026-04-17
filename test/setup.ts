// Chrome API mock for test environment
const noop = () => {};

const storageMock = {
  get: (_keys: unknown, callback?: (items: Record<string, unknown>) => void) => {
    callback?.({});
    return Promise.resolve({});
  },
  set: (_items: unknown, callback?: () => void) => {
    callback?.();
    return Promise.resolve();
  },
};

const chromeMock = {
  storage: {
    local: storageMock,
    sync: storageMock,
    onChanged: { addListener: noop, removeListener: noop },
  },
  runtime: {
    sendMessage: noop,
    onMessage: { addListener: noop, removeListener: noop },
  },
  tabs: {
    query: (_query: unknown, callback?: (tabs: unknown[]) => void) => {
      callback?.([]);
      return Promise.resolve([]);
    },
    sendMessage: noop,
  },
};

Object.assign(globalThis, { chrome: chromeMock });
