"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

global.window = globalThis;
require("../js/core/state-store.js");

const { createStateStore } = globalThis.ASOUL_STATE_STORE;

function createMemoryStorage(initialValue = null) {
  const values = new Map(initialValue === null ? [] : [["diary", initialValue]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
    value: (key) => values.get(key) ?? null,
  };
}

function createManualClock() {
  let callback = null;
  return {
    clearTimeout() {
      callback = null;
    },
    run() {
      const current = callback;
      callback = null;
      current?.();
    },
    setTimeout(next) {
      callback = next;
      return 1;
    },
  };
}

function createStore(storage, overrides = {}) {
  return createStateStore({
    key: "diary",
    normalize: (value) => ({ count: Number(value.count) || 0 }),
    createDefault: () => ({ count: 0 }),
    resolveLoadIssue: (error) => error.code === "future" ? "future version" : "invalid data",
    getStorage: () => storage,
    ...overrides,
  });
}

test("loads normalized state and creates an isolated default when storage is empty", () => {
  const populated = createStore(createMemoryStorage('{"count":"4"}'));
  assert.deepEqual(populated.load(), { count: 4 });

  const empty = createStore(createMemoryStorage());
  const first = empty.load();
  first.count = 9;
  assert.deepEqual(empty.load(), { count: 0 });
});

test("invalid stored data blocks saves until an explicit recovery", () => {
  const storage = createMemoryStorage("not json");
  const store = createStore(storage);

  assert.deepEqual(store.load(), { count: 0 });
  assert.deepEqual(store.getStatus(), {
    available: true,
    blocked: true,
    issue: "invalid data",
    hasScheduledSave: false,
  });
  assert.equal(store.save({ count: 7 }), false);
  assert.equal(storage.value("diary"), "not json");

  store.unblock();
  assert.equal(store.save({ count: 7 }), true);
  assert.equal(storage.value("diary"), '{"count":7}');
});

test("scheduled saves keep only the latest provider and can be flushed", () => {
  const storage = createMemoryStorage();
  const clock = createManualClock();
  const store = createStore(storage, { clock });
  let state = { count: 1 };

  store.schedule(() => state);
  state = { count: 2 };
  store.schedule(() => state);
  assert.equal(store.getStatus().hasScheduledSave, true);
  assert.equal(store.flush(), true);
  assert.equal(storage.value("diary"), '{"count":2}');
  assert.equal(store.getStatus().hasScheduledSave, false);

  state = { count: 3 };
  store.schedule(() => state);
  clock.run();
  assert.equal(storage.value("diary"), '{"count":3}');
});

test("clear cancels deferred work and removes stored state", () => {
  const storage = createMemoryStorage('{"count":5}');
  const clock = createManualClock();
  const store = createStore(storage, { clock });

  store.schedule({ count: 8 });
  assert.equal(store.clear(), true);
  clock.run();
  assert.equal(storage.value("diary"), null);
  assert.deepEqual(store.getStatus(), {
    available: true,
    blocked: false,
    issue: "",
    hasScheduledSave: false,
  });
});

test("unavailable storage falls back safely without attempting writes", () => {
  const store = createStore({
    getItem() {
      throw new Error("denied");
    },
  });

  assert.deepEqual(store.load(), { count: 0 });
  assert.equal(store.getStatus().available, false);
  assert.equal(store.save({ count: 2 }), false);
});
