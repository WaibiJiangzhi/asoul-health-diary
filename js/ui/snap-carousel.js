(() => {
  "use strict";

  const bindings = new WeakMap();

  function isCompactViewport(maxWidth) {
    return typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia(`(max-width: ${maxWidth}px)`).matches;
  }

  function revealSelectedCard(container, selector, options = {}) {
    const maxWidth = Number(options.maxWidth) || 900;
    if (!container || !selector || !isCompactViewport(maxWidth)) return;
    const requestFrame = typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame.bind(window)
      : (callback) => callback();
    requestFrame(() => {
      if (!container.isConnected || container.clientWidth <= 0) return;
      const control = container.querySelector(selector);
      const card = control?.closest(options.cardSelector || ".goal-card, .progress-goal-card") || control;
      if (!card) return;
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const left = container.scrollLeft + cardRect.left - containerRect.left
        - (container.clientWidth - cardRect.width) / 2;
      const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth);
      container.scrollTo({ left: Math.max(0, Math.min(maxLeft, left)), behavior: "auto" });
    });
  }

  function bindSnapSelection(container, selector, getSelectedId, selectId, getControlId, options = {}) {
    const maxWidth = Number(options.maxWidth) || 900;
    if (!container || !selector || !isCompactViewport(maxWidth)) return () => {};
    const existing = bindings.get(container);
    if (existing) return existing.dispose;

    let timer = null;
    const readControlId = typeof getControlId === "function"
      ? getControlId
      : (control) => control?.dataset.selectGoal || control?.dataset.selectProgressGoal;
    const syncSelection = () => {
      window.clearTimeout(timer);
      timer = null;
      if (!container.isConnected) return;
      const controls = [...container.querySelectorAll(selector)];
      if (controls.length < 2) return;
      const center = container.getBoundingClientRect().left + container.clientWidth / 2;
      const nearest = controls.reduce((best, control) => {
        const rect = control.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - center);
        return !best || distance < best.distance ? { control, distance } : best;
      }, null)?.control;
      const id = readControlId(nearest);
      if (id && id !== getSelectedId()) selectId(id);
    };
    const queueSelectionSync = (delay = 140) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(syncSelection, delay);
    };
    const onScroll = () => queueSelectionSync();
    const onPointerUp = () => queueSelectionSync(180);
    const onTouchEnd = () => queueSelectionSync(180);
    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("scrollend", syncSelection, { passive: true });
    container.addEventListener("pointerup", onPointerUp, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });

    const dispose = () => {
      window.clearTimeout(timer);
      timer = null;
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("scrollend", syncSelection);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("touchend", onTouchEnd);
      bindings.delete(container);
    };
    bindings.set(container, { dispose });
    return dispose;
  }

  globalThis.ASOUL_SNAP_CAROUSEL = Object.freeze({
    bindSnapSelection,
    revealSelectedCard,
  });
})();
