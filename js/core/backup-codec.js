(() => {
  "use strict";

  const BACKUP_TYPE = "asoul-life-diary";
  const SUPPORTED_BACKUP_TYPES = Object.freeze(["asoul-health-diary", BACKUP_TYPE]);
  const INVALID_BACKUP_CODE = "ASOUL_INVALID_BACKUP";

  function isDiaryBackupPayload(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
    if (candidate.backupType && !SUPPORTED_BACKUP_TYPES.includes(candidate.backupType)) return false;
    const hasProfile = candidate.profile && typeof candidate.profile === "object" && !Array.isArray(candidate.profile);
    const hasCharts = Array.isArray(candidate.charts);
    const hasWeeks = candidate.weeks === undefined || Array.isArray(candidate.weeks) || Array.isArray(candidate.weeklyPlans);
    return Boolean(hasProfile && hasCharts && hasWeeks);
  }

  function createDiaryBackupPayload(state, exportedAt = new Date().toISOString()) {
    return {
      backupType: BACKUP_TYPE,
      exportedAt,
      ...(state && typeof state === "object" && !Array.isArray(state) ? state : {}),
    };
  }

  function parseDiaryBackup(text) {
    let candidate;
    try {
      candidate = JSON.parse(String(text));
    } catch (error) {
      const invalidBackup = new Error("Invalid diary backup JSON");
      invalidBackup.code = INVALID_BACKUP_CODE;
      throw invalidBackup;
    }
    if (!isDiaryBackupPayload(candidate)) {
      const invalidBackup = new Error("Invalid diary backup structure");
      invalidBackup.code = INVALID_BACKUP_CODE;
      throw invalidBackup;
    }
    return candidate;
  }

  globalThis.ASOUL_BACKUP_CODEC = Object.freeze({
    BACKUP_TYPE,
    INVALID_BACKUP_CODE,
    SUPPORTED_BACKUP_TYPES,
    createDiaryBackupPayload,
    isDiaryBackupPayload,
    parseDiaryBackup,
  });
})();
