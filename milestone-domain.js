(() => {
  "use strict";

  const MAX_PROGRESS_VALUE = 1_000_000_000;
  const MAX_PROGRESS_UPDATES = 100;

  function getProgressPercent(goal) {
    const current = Number(goal?.current);
    const target = Number(goal?.target);
    if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return 0;
    return Math.min(100, Math.max(0, current / target * 100));
  }

  function getReportSpaceNames(item, spaces) {
    const spaceNames = new Map((Array.isArray(spaces) ? spaces : []).map((space) => [space.id, space.name]));
    return (Array.isArray(item?.spaceIds) ? item.spaceIds : [])
      .map((spaceId) => spaceNames.get(spaceId))
      .filter(Boolean);
  }

  function selectValidSpaceIds(candidate, spaces) {
    const validSpaceIds = new Set((Array.isArray(spaces) ? spaces : []).map((space) => space.id));
    return [...new Set((Array.isArray(candidate) ? candidate : [])
      .map((spaceId) => String(spaceId ?? "").trim().slice(0, 60))
      .filter((spaceId) => validSpaceIds.has(spaceId)))];
  }

  function moveItemById(collection, selectedId, direction) {
    const items = Array.isArray(collection) ? collection : [];
    const index = items.findIndex((item) => item?.id === selectedId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return { items, moved: false };
    const movedItems = items.slice();
    [movedItems[index], movedItems[target]] = [movedItems[target], movedItems[index]];
    return { items: movedItems, moved: true };
  }

  function applyProgressDelta(goal, amount, update) {
    const numericAmount = Number(amount);
    if (!goal || !Number.isFinite(numericAmount) || numericAmount === 0) return null;
    const current = Math.max(0, Math.min(MAX_PROGRESS_VALUE, Number(goal.current) + numericAmount));
    const updates = [...(Array.isArray(goal.updates) ? goal.updates : []), {
      id: update.id,
      amount: numericAmount,
      createdAt: update.createdAt,
    }].slice(-MAX_PROGRESS_UPDATES);
    return {
      ...goal,
      current,
      defaultIncrement: numericAmount,
      updates,
    };
  }

  globalThis.ASOUL_MILESTONE_DOMAIN = Object.freeze({
    applyProgressDelta,
    getProgressPercent,
    getReportSpaceNames,
    moveItemById,
    selectValidSpaceIds,
  });
})();
