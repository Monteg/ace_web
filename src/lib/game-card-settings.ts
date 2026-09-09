import {
  GAME_CARD_SETTINGS_EVENT,
  GAME_CARD_SETTINGS_STORAGE_KEY,
  gameCardDefaults,
  type GameCardSettings,
} from '../data/game-card-settings';

let settingsSyncMounted = false;
let settingsChannel: BroadcastChannel | null = null;

const GAME_CARD_SETTINGS_CHANNEL = 'ace-game-card-settings-sync-v1';

function clampedNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export function normalizeGameCardSettings(value: unknown): GameCardSettings {
  const candidate = value && typeof value === 'object' ? value as Partial<GameCardSettings> : {};

  return {
    quickPlayEnabled: typeof candidate.quickPlayEnabled === 'boolean'
      ? candidate.quickPlayEnabled
      : gameCardDefaults.quickPlayEnabled,
    hoverScale: clampedNumber(candidate.hoverScale, gameCardDefaults.hoverScale, 1, 1.08),
    hoverLift: clampedNumber(candidate.hoverLift, gameCardDefaults.hoverLift, 0, 18),
    motionDuration: clampedNumber(candidate.motionDuration, gameCardDefaults.motionDuration, 0.1, 1.2),
    backgroundScale: clampedNumber(candidate.backgroundScale, gameCardDefaults.backgroundScale, 1, 1.2),
    backgroundOpacity: clampedNumber(candidate.backgroundOpacity, gameCardDefaults.backgroundOpacity, 0.2, 1),
    logoScale: clampedNumber(candidate.logoScale, gameCardDefaults.logoScale, 1, 1.5),
    logoShiftX: clampedNumber(candidate.logoShiftX, gameCardDefaults.logoShiftX, -30, 20),
    logoLift: clampedNumber(candidate.logoLift, gameCardDefaults.logoLift, 0, 60),
    playPosition: clampedNumber(candidate.playPosition, gameCardDefaults.playPosition, 36, 68),
    playTravel: clampedNumber(candidate.playTravel, gameCardDefaults.playTravel, 0, 40),
    buttonHoverScale: clampedNumber(candidate.buttonHoverScale, gameCardDefaults.buttonHoverScale, 1, 1.12),
    mobileBackgroundOpacity: clampedNumber(candidate.mobileBackgroundOpacity, gameCardDefaults.mobileBackgroundOpacity, 0.55, 1),
    mobileLogoLift: clampedNumber(candidate.mobileLogoLift, gameCardDefaults.mobileLogoLift, 0, 50),
    shadeHeight: clampedNumber(candidate.shadeHeight, gameCardDefaults.shadeHeight, 35, 85),
    shadeOpacity: clampedNumber(candidate.shadeOpacity, gameCardDefaults.shadeOpacity, 0, 1),
    shadeBlur: clampedNumber(candidate.shadeBlur, gameCardDefaults.shadeBlur, 0, 30),
    borderWidth: clampedNumber(candidate.borderWidth, gameCardDefaults.borderWidth, 0, 4),
    borderOpacity: clampedNumber(candidate.borderOpacity, gameCardDefaults.borderOpacity, 0, 1),
    cornerRadius: clampedNumber(candidate.cornerRadius, gameCardDefaults.cornerRadius, 0, 32),
  };
}

export function readGameCardSettings(): GameCardSettings | null {
  try {
    const stored = window.localStorage.getItem(GAME_CARD_SETTINGS_STORAGE_KEY);
    return stored ? normalizeGameCardSettings(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

export function applyGameCardSettings(
  settings: GameCardSettings,
  root: ParentNode = document,
) {
  const normalized = normalizeGameCardSettings(settings);
  const scope = root instanceof Document
    ? root.documentElement
    : root instanceof HTMLElement
      ? root
      : null;

  if (scope) {
    scope.dataset.gameCardQuickPlayEnabled = String(normalized.quickPlayEnabled);
    scope.style.setProperty('--gc-hover-scale', String(normalized.hoverScale));
    scope.style.setProperty('--gc-hover-lift', `${normalized.hoverLift}px`);
    scope.style.setProperty('--gc-duration', `${normalized.motionDuration}s`);
    scope.style.setProperty('--gc-background-scale', String(normalized.backgroundScale));
    scope.style.setProperty('--gc-background-opacity', String(normalized.backgroundOpacity));
    scope.style.setProperty('--gc-logo-scale', String(normalized.logoScale));
    scope.style.setProperty('--gc-logo-shift-x', `${normalized.logoShiftX}%`);
    scope.style.setProperty('--gc-logo-lift', `${normalized.logoLift}%`);
    scope.style.setProperty('--gc-play-position', `${normalized.playPosition}%`);
    scope.style.setProperty('--gc-play-travel', `${normalized.playTravel}px`);
    scope.style.setProperty('--gc-button-hover-scale', String(normalized.buttonHoverScale));
    scope.style.setProperty('--gc-mobile-background-opacity', String(normalized.mobileBackgroundOpacity));
    scope.style.setProperty('--gc-mobile-logo-lift', `${normalized.mobileLogoLift}%`);
    scope.style.setProperty('--gc-shade-height', `${normalized.shadeHeight}%`);
    scope.style.setProperty('--gc-shade-opacity', String(normalized.shadeOpacity));
    scope.style.setProperty('--gc-shade-blur', `${normalized.shadeBlur}px`);
    scope.style.setProperty('--gc-border-width', `${normalized.borderWidth}px`);
    scope.style.setProperty('--gc-border-opacity', String(normalized.borderOpacity));
    scope.style.setProperty('--gc-radius', `${normalized.cornerRadius}px`);
  }

  root.querySelectorAll<HTMLElement>('[data-game-card]').forEach((card) => {
    card.dataset.quickPlayEnabled = String(normalized.quickPlayEnabled);
    card.style.setProperty('--gc-hover-scale', String(normalized.hoverScale));
    card.style.setProperty('--gc-hover-lift', `${normalized.hoverLift}px`);
    card.style.setProperty('--gc-duration', `${normalized.motionDuration}s`);
    card.style.setProperty('--gc-background-scale', String(normalized.backgroundScale));
    card.style.setProperty('--gc-background-opacity', String(normalized.backgroundOpacity));
    card.style.setProperty('--gc-logo-scale', String(normalized.logoScale));
    card.style.setProperty('--gc-logo-shift-x', `${normalized.logoShiftX}%`);
    card.style.setProperty('--gc-logo-lift', `${normalized.logoLift}%`);
    card.style.setProperty('--gc-play-position', `${normalized.playPosition}%`);
    card.style.setProperty('--gc-play-travel', `${normalized.playTravel}px`);
    card.style.setProperty('--gc-button-hover-scale', String(normalized.buttonHoverScale));
    card.style.setProperty('--gc-mobile-background-opacity', String(normalized.mobileBackgroundOpacity));
    card.style.setProperty('--gc-mobile-logo-lift', `${normalized.mobileLogoLift}%`);
    card.style.setProperty('--gc-shade-height', `${normalized.shadeHeight}%`);
    card.style.setProperty('--gc-shade-opacity', String(normalized.shadeOpacity));
    card.style.setProperty('--gc-shade-blur', `${normalized.shadeBlur}px`);
    card.style.setProperty('--gc-border-width', `${normalized.borderWidth}px`);
    card.style.setProperty('--gc-border-opacity', String(normalized.borderOpacity));
    card.style.setProperty('--gc-radius', `${normalized.cornerRadius}px`);
  });
}

export function saveGameCardSettings(value: unknown) {
  const settings = normalizeGameCardSettings(value);
  try {
    window.localStorage.setItem(GAME_CARD_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // The current page still receives the settings when storage is unavailable.
  }
  applyGameCardSettings(settings);
  window.dispatchEvent(new CustomEvent(GAME_CARD_SETTINGS_EVENT, { detail: settings }));
  settingsChannel?.postMessage(settings);
  return settings;
}

function mountSettingsSync() {
  if (settingsSyncMounted) return;
  settingsSyncMounted = true;

  window.addEventListener(GAME_CARD_SETTINGS_EVENT, (event) => {
    applyGameCardSettings(normalizeGameCardSettings((event as CustomEvent).detail));
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== GAME_CARD_SETTINGS_STORAGE_KEY || !event.newValue) return;
    try {
      applyGameCardSettings(normalizeGameCardSettings(JSON.parse(event.newValue)));
    } catch {
      // Ignore malformed browser storage and keep the built-in defaults.
    }
  });

  if ('BroadcastChannel' in window) {
    settingsChannel = new BroadcastChannel(GAME_CARD_SETTINGS_CHANNEL);
    settingsChannel.addEventListener('message', (event) => {
      applyGameCardSettings(normalizeGameCardSettings(event.data));
    });
  }

  const refreshFromStorage = () => {
    applyGameCardSettings(readGameCardSettings() ?? gameCardDefaults);
  };
  window.addEventListener('focus', refreshFromStorage);
  window.addEventListener('pageshow', refreshFromStorage);
  document.addEventListener('astro:page-load', refreshFromStorage);
}

export function mountGameCardSettings(root: ParentNode = document) {
  applyGameCardSettings(readGameCardSettings() ?? gameCardDefaults, root);
  mountSettingsSync();
}
