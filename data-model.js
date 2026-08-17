(() => {
  "use strict";

  const CURRENT_STATE_VERSION = 5;
  const MIN_SUPPORTED_STATE_VERSION = 1;
  const UNSUPPORTED_VERSION_CODE = "ASOUL_UNSUPPORTED_STATE_VERSION";
  const DEFAULT_SPACES = Object.freeze([
    Object.freeze({ id: "health", type: "health", name: "健康", icon: "♡" }),
    Object.freeze({ id: "study", type: "study", name: "考研", icon: "✎" }),
    Object.freeze({ id: "work", type: "work", name: "工作", icon: "▣" }),
  ]);

  const clone = (value) => {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  };

  const migrations = new Map([
    [1, (state) => ({
      ...state,
      weeks: Array.isArray(state.weeks)
        ? state.weeks
        : Array.isArray(state.weeklyPlans)
          ? state.weeklyPlans
          : [],
      version: 2,
    })],
    [2, (state) => ({
      ...state,
      weeks: Array.isArray(state.weeks) ? state.weeks : [],
      charts: Array.isArray(state.charts) ? state.charts : [],
      version: 3,
    })],
    [3, (state) => ({
      ...state,
      version: 4,
    })],
    [4, (state) => ({
      ...state,
      spaces: DEFAULT_SPACES.map((space) => ({ ...space })),
      activeSpaceId: "health",
      weeks: Array.isArray(state.weeks)
        ? state.weeks.map((week) => ({ ...week, spaceId: "health" }))
        : [],
      charts: Array.isArray(state.charts)
        ? state.charts.map((chart) => ({ ...chart, spaceId: "health" }))
        : [],
      version: 5,
    })],
  ]);

  function readVersion(candidate) {
    const version = Number(candidate?.version);
    return Number.isInteger(version) && version >= MIN_SUPPORTED_STATE_VERSION
      ? version
      : MIN_SUPPORTED_STATE_VERSION;
  }

  function migrateState(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return candidate;

    let state = clone(candidate);
    let version = readVersion(state);
    if (version > CURRENT_STATE_VERSION) {
      const error = new Error(`Unsupported state version: ${version}`);
      error.code = UNSUPPORTED_VERSION_CODE;
      error.stateVersion = version;
      throw error;
    }

    while (version < CURRENT_STATE_VERSION) {
      const migrate = migrations.get(version);
      if (!migrate) throw new Error(`Missing migration from state version ${version}`);
      state = migrate(state);
      version = readVersion(state);
    }

    state.version = CURRENT_STATE_VERSION;
    return state;
  }

  globalThis.ASOUL_DATA_MODEL = Object.freeze({
    CURRENT_STATE_VERSION,
    MIN_SUPPORTED_STATE_VERSION,
    UNSUPPORTED_VERSION_CODE,
    DEFAULT_SPACES,
    migrateState,
  });
})();
