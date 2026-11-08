const PlatformSettings = require('../models/PlatformSettings');

// Platform settings are read on many requests (listing rules, maintenance
// mode, messaging switch), so keep a short in-memory copy. Admin updates
// call clearSettingsCache() so changes apply immediately on this instance.
const TTL_MS = 30 * 1000;
let cached = null;
let cachedAt = 0;

async function getSettings() {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  const doc = await PlatformSettings.getSettings();
  cached = doc.toObject();
  cachedAt = Date.now();
  return cached;
}

function clearSettingsCache() {
  cached = null;
  cachedAt = 0;
}

// Maintenance is on when the switch is set and we are inside the optional window.
function isMaintenanceActive(settings, now = new Date()) {
  const m = settings?.maintenance || {};
  if (!m.isMaintenanceMode) return false;
  if (m.maintenanceStartTime && now < new Date(m.maintenanceStartTime)) return false;
  if (m.maintenanceEndTime && now > new Date(m.maintenanceEndTime)) return false;
  return true;
}

module.exports = { getSettings, clearSettingsCache, isMaintenanceActive };
