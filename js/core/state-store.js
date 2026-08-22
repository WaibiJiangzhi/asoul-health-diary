(() => {
  "use strict";

  function createStateStore(options = {}) {
    const {
      key,
      normalize,
      createDefault,
      resolveLoadIssue = () => "本地数据读取失败",
      onSaveError = () => {},
      getStorage = () => globalThis.localStorage,
      clock = globalThis,
      debounceMs = 420,
    } = options;

    if (!key || typeof normalize !== "function" || typeof createDefault !== "function") {
      throw new TypeError("state-store requires key, normalize, and createDefault");
    }

    let available = true;
    let blocked = false;
    let issue = "";
    let saveTimer = null;
    let pendingValueProvider = null;

    function cancelScheduledSave() {
      if (saveTimer !== null) clock.clearTimeout(saveTimer);
      saveTimer = null;
      pendingValueProvider = null;
    }

    function load() {
      let raw;
      try {
        raw = getStorage().getItem(key);
      } catch (error) {
        available = false;
        return createDefault();
      }

      if (!raw) return createDefault();
      try {
        return normalize(JSON.parse(raw));
      } catch (error) {
        blocked = true;
        issue = resolveLoadIssue(error);
        return createDefault();
      }
    }

    function save(value) {
      if (!available || blocked) return false;
      try {
        getStorage().setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        onSaveError(error);
        return false;
      }
    }

    function schedule(valueProvider) {
      if (!available || blocked) return false;
      cancelScheduledSave();
      pendingValueProvider = typeof valueProvider === "function" ? valueProvider : () => valueProvider;
      saveTimer = clock.setTimeout(() => {
        const provider = pendingValueProvider;
        saveTimer = null;
        pendingValueProvider = null;
        if (provider) save(provider());
      }, debounceMs);
      return true;
    }

    function flush() {
      if (saveTimer === null) return false;
      const provider = pendingValueProvider;
      cancelScheduledSave();
      return provider ? save(provider()) : false;
    }

    function unblock() {
      blocked = false;
      issue = "";
    }

    function clear() {
      cancelScheduledSave();
      unblock();
      try {
        getStorage().removeItem(key);
        available = true;
        return true;
      } catch (error) {
        available = false;
        return false;
      }
    }

    function getStatus() {
      return Object.freeze({ available, blocked, issue, hasScheduledSave: saveTimer !== null });
    }

    return Object.freeze({
      clear,
      flush,
      getStatus,
      load,
      save,
      schedule,
      unblock,
    });
  }

  globalThis.ASOUL_STATE_STORE = Object.freeze({ createStateStore });
})();
