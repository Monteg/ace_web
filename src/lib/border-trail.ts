import {
  BORDER_TRAIL_SETTINGS_EVENT,
  BORDER_TRAIL_SETTINGS_STORAGE_KEY,
  borderTrailDefaults,
  type BorderTrailSettings,
} from '../data/border-trail-settings';

let settingsSyncMounted = false;

function clampedNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export function normalizeBorderTrailSettings(value: unknown): BorderTrailSettings {
  const candidate = value && typeof value === 'object' ? value as Partial<BorderTrailSettings> : {};

  return {
    orbitDuration: clampedNumber(candidate.orbitDuration, borderTrailDefaults.orbitDuration, 1.5, 20),
    orbitLength: clampedNumber(candidate.orbitLength, borderTrailDefaults.orbitLength, 6, 60),
    orbitWidth: clampedNumber(candidate.orbitWidth, borderTrailDefaults.orbitWidth, 0.5, 4),
    orbitOpacity: clampedNumber(candidate.orbitOpacity, borderTrailDefaults.orbitOpacity, 0, 1),
    orbitBlur: clampedNumber(candidate.orbitBlur, borderTrailDefaults.orbitBlur, 0, 16),
  };
}

export function readBorderTrailSettings(): BorderTrailSettings | null {
  try {
    const stored = window.localStorage.getItem(BORDER_TRAIL_SETTINGS_STORAGE_KEY);
    return stored ? normalizeBorderTrailSettings(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

export function applyBorderTrailSettings(
  settings: BorderTrailSettings,
  root: ParentNode = document,
) {
  root.querySelectorAll<HTMLElement>('[data-border-trail-host]').forEach((host) => {
    host.style.setProperty('--orbit-duration', `${settings.orbitDuration}s`);
    host.style.setProperty('--orbit-length', `${settings.orbitLength}%`);
    host.style.setProperty('--orbit-width', `${settings.orbitWidth}px`);
    host.style.setProperty('--orbit-opacity', String(settings.orbitOpacity));
    host.style.setProperty('--orbit-blur', `${settings.orbitBlur}px`);
  });
}

export function saveBorderTrailSettings(value: unknown) {
  const settings = normalizeBorderTrailSettings(value);
  try {
    window.localStorage.setItem(BORDER_TRAIL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // The current page still receives the settings when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(BORDER_TRAIL_SETTINGS_EVENT, { detail: settings }));
  return settings;
}

function mountSettingsSync() {
  if (settingsSyncMounted) return;
  settingsSyncMounted = true;

  window.addEventListener(BORDER_TRAIL_SETTINGS_EVENT, (event) => {
    applyBorderTrailSettings(normalizeBorderTrailSettings((event as CustomEvent).detail));
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== BORDER_TRAIL_SETTINGS_STORAGE_KEY || !event.newValue) return;
    try {
      applyBorderTrailSettings(normalizeBorderTrailSettings(JSON.parse(event.newValue)));
    } catch {
      // Ignore malformed browser storage and keep the built-in defaults.
    }
  });
}

export function mountBorderTrailSettings(root: ParentNode = document) {
  applyBorderTrailSettings(readBorderTrailSettings() ?? borderTrailDefaults, root);
  mountSettingsSync();
}
