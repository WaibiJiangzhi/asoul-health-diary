"use strict";

const assert = require("node:assert/strict");

const timers = new Map();
let nextTimerId = 1;
global.window = {
  matchMedia: () => ({ matches: true }),
  requestAnimationFrame: (callback) => callback(),
  setTimeout(callback) {
    const id = nextTimerId++;
    timers.set(id, callback);
    return id;
  },
  clearTimeout(id) {
    timers.delete(id);
  },
};

require("../js/ui/snap-carousel.js");
const carousel = globalThis.ASOUL_SNAP_CAROUSEL;

function makeControl(id, left, width = 100) {
  return {
    dataset: { itemId: id },
    getBoundingClientRect: () => ({ left, width }),
    closest: () => null,
  };
}

function makeContainer(controls) {
  const listeners = new Map();
  return {
    isConnected: true,
    clientWidth: 200,
    scrollWidth: 600,
    scrollLeft: 0,
    querySelectorAll: () => controls,
    querySelector: () => controls[0],
    getBoundingClientRect: () => ({ left: 0 }),
    addEventListener(type, callback) { listeners.set(type, callback); },
    removeEventListener(type) { listeners.delete(type); },
    scrollTo(options) { this.scrollLeft = options.left; },
    dispatch(type) { listeners.get(type)?.(); },
    listenerCount: () => listeners.size,
  };
}

const controls = [makeControl("first", 0), makeControl("second", 75), makeControl("third", 230)];
const container = makeContainer(controls);
let selectedId = "first";
const dispose = carousel.bindSnapSelection(
  container,
  "[data-item-id]",
  () => selectedId,
  (id) => { selectedId = id; },
  (control) => control?.dataset.itemId,
);

container.dispatch("scrollend");
assert.equal(selectedId, "second", "the control nearest the rail centre must become selected");
assert.equal(container.listenerCount(), 4, "one lifecycle binding must own all carousel listeners");
assert.equal(carousel.bindSnapSelection(container, "x", () => selectedId, () => {}), dispose, "re-rendering must reuse the existing binding");

container.dispatch("scroll");
assert.ok(timers.size > 0, "scroll synchronization should be debounced");
container.isConnected = false;
for (const callback of [...timers.values()]) callback();
assert.equal(selectedId, "second", "a detached rail must not write stale selection state");

dispose();
assert.equal(container.listenerCount(), 0, "disposing a carousel must remove every listener");
assert.equal(timers.size, 0, "disposing a carousel must clear pending work");

const revealContainer = makeContainer([makeControl("only", 240, 80)]);
carousel.revealSelectedCard(revealContainer, "[data-item-id]");
assert.equal(revealContainer.scrollLeft, 180, "revealing a selected card must centre it within the scroll range");

console.log("snap carousel: ok");
