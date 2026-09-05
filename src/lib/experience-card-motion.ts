import {
  EXPERIENCE_CARD_SETTINGS_EVENT,
  EXPERIENCE_CARD_SETTINGS_STORAGE_KEY,
  experienceCardDefaults,
  type ExperienceCardSettings,
} from '../data/experience-card-settings';

let settingsSyncMounted = false;

function numberFrom(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampedNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export function normalizeExperienceCardSettings(value: unknown): ExperienceCardSettings {
  const candidate = value && typeof value === 'object' ? value as Partial<ExperienceCardSettings> : {};

  return {
    tiltMax: clampedNumber(candidate.tiltMax, experienceCardDefaults.tiltMax, 0, 18),
    hoverScale: clampedNumber(candidate.hoverScale, experienceCardDefaults.hoverScale, 1, 1.08),
    perspective: clampedNumber(candidate.perspective, experienceCardDefaults.perspective, 600, 2200),
    response: clampedNumber(candidate.response, experienceCardDefaults.response, 0.12, 0.9),
    artDepth: clampedNumber(candidate.artDepth, experienceCardDefaults.artDepth, 0, 100),
    copyDepth: clampedNumber(candidate.copyDepth, experienceCardDefaults.copyDepth, 0, 120),
    glareOpacity: clampedNumber(candidate.glareOpacity, experienceCardDefaults.glareOpacity, 0, 1),
    glareTravel: clampedNumber(candidate.glareTravel, experienceCardDefaults.glareTravel, 0, 48),
  };
}

export function readExperienceCardSettings(): ExperienceCardSettings | null {
  try {
    const stored = window.localStorage.getItem(EXPERIENCE_CARD_SETTINGS_STORAGE_KEY);
    return stored ? normalizeExperienceCardSettings(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

export function applyExperienceCardSettings(
  settings: ExperienceCardSettings,
  root: ParentNode = document,
) {
  root.querySelectorAll<HTMLElement>('[data-experience-card-stage]').forEach((stage) => {
    const card = stage.querySelector<HTMLElement>('[data-experience-card]');
    if (!card) return;

    stage.style.setProperty('--card-perspective', `${settings.perspective}px`);
    stage.style.setProperty('--art-depth', `${settings.artDepth}px`);
    stage.style.setProperty('--copy-depth', `${settings.copyDepth}px`);
    stage.style.setProperty('--glare-opacity', String(settings.glareOpacity));
    card.dataset.tiltMax = String(settings.tiltMax);
    card.dataset.hoverScale = String(settings.hoverScale);
    card.dataset.motionDuration = String(settings.response);
    card.dataset.glareTravel = String(settings.glareTravel);
  });
}

export function saveExperienceCardSettings(value: unknown) {
  const settings = normalizeExperienceCardSettings(value);
  try {
    window.localStorage.setItem(EXPERIENCE_CARD_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // The live page still receives the settings when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(EXPERIENCE_CARD_SETTINGS_EVENT, { detail: settings }));
  return settings;
}

function mountSettingsSync() {
  if (settingsSyncMounted) return;
  settingsSyncMounted = true;

  window.addEventListener(EXPERIENCE_CARD_SETTINGS_EVENT, (event) => {
    const settings = normalizeExperienceCardSettings((event as CustomEvent).detail);
    applyExperienceCardSettings(settings);
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== EXPERIENCE_CARD_SETTINGS_STORAGE_KEY || !event.newValue) return;
    try {
      applyExperienceCardSettings(normalizeExperienceCardSettings(JSON.parse(event.newValue)));
    } catch {
      // Ignore malformed browser storage and keep the built-in defaults.
    }
  });
}

export function mountExperienceCardMotion(root: ParentNode = document) {
  applyExperienceCardSettings(readExperienceCardSettings() ?? experienceCardDefaults, root);
  mountSettingsSync();

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reducedMotion.matches) return;

  const cards = root.querySelectorAll<HTMLElement>('[data-experience-card]:not([data-motion-mounted])');
  if (!cards.length) return;

  import('gsap').then(({ gsap }) => {
    cards.forEach((card) => {
      card.dataset.motionMounted = 'true';
      const stage = card.closest<HTMLElement>('[data-experience-card-stage]');
      const glare = card.querySelector<HTMLElement>('[data-experience-glare]');
      if (!stage || !glare) return;

      gsap.set(card, { transformStyle: 'preserve-3d' });

      let pointerFrame = 0;
      let latestPointer: PointerEvent | null = null;

      const renderPointer = () => {
        pointerFrame = 0;
        if (!latestPointer) return;

        const rect = card.getBoundingClientRect();
        const x = Math.min(1, Math.max(-1, ((latestPointer.clientX - rect.left) / rect.width) * 2 - 1));
        const y = Math.min(1, Math.max(-1, ((latestPointer.clientY - rect.top) / rect.height) * 2 - 1));
        const tilt = numberFrom(card.dataset.tiltMax, experienceCardDefaults.tiltMax);
        const scale = numberFrom(card.dataset.hoverScale, experienceCardDefaults.hoverScale);
        const duration = numberFrom(card.dataset.motionDuration, experienceCardDefaults.response);
        const glareTravel = numberFrom(card.dataset.glareTravel, experienceCardDefaults.glareTravel);

        gsap.to(card, {
          rotationX: -y * tilt,
          rotationY: x * tilt,
          scale,
          duration,
          ease: 'power3.out',
          overwrite: true,
        });
        gsap.to(glare, {
          '--glare-x': `${50 + x * glareTravel}%`,
          '--glare-y': `${50 + y * glareTravel}%`,
          duration: Math.max(0.18, duration * 0.78),
          ease: 'power2.out',
          overwrite: true,
        });
      };

      card.addEventListener('pointerenter', () => {
        card.dataset.pointerActive = 'true';
      });
      card.addEventListener('pointermove', (event) => {
        latestPointer = event;
        if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
      });
      card.addEventListener('pointerleave', () => {
        latestPointer = null;
        if (pointerFrame) cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
        card.dataset.pointerActive = 'false';
        const duration = Math.max(0.34, numberFrom(card.dataset.motionDuration, experienceCardDefaults.response));
        gsap.to(card, { rotationX: 0, rotationY: 0, scale: 1, duration, ease: 'power3.out', overwrite: true });
        gsap.to(glare, {
          '--glare-x': '50%',
          '--glare-y': '50%',
          duration,
          ease: 'power3.out',
          overwrite: true,
        });
      });
    });
  });
}
