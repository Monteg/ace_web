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
    autoMotionEnabled: typeof candidate.autoMotionEnabled === 'boolean'
      ? candidate.autoMotionEnabled
      : experienceCardDefaults.autoMotionEnabled,
    tiltMax: clampedNumber(candidate.tiltMax, experienceCardDefaults.tiltMax, 0, 18),
    hoverScale: clampedNumber(candidate.hoverScale, experienceCardDefaults.hoverScale, 1, 1.08),
    perspective: clampedNumber(candidate.perspective, experienceCardDefaults.perspective, 600, 2200),
    response: clampedNumber(candidate.response, experienceCardDefaults.response, 0.12, 3),
    autoSweepDuration: clampedNumber(candidate.autoSweepDuration, experienceCardDefaults.autoSweepDuration, 1.2, 12),
    autoTransitionDuration: clampedNumber(candidate.autoTransitionDuration, experienceCardDefaults.autoTransitionDuration, 0.2, 4),
    autoLoopDelay: clampedNumber(candidate.autoLoopDelay, experienceCardDefaults.autoLoopDelay, 0, 6),
    artDepth: clampedNumber(candidate.artDepth, experienceCardDefaults.artDepth, 0, 100),
    copyDepth: clampedNumber(candidate.copyDepth, experienceCardDefaults.copyDepth, 0, 120),
    glareOpacity: clampedNumber(candidate.glareOpacity, experienceCardDefaults.glareOpacity, 0, 1),
    glareTravel: clampedNumber(candidate.glareTravel, experienceCardDefaults.glareTravel, 0, 48),
    hologramSize: clampedNumber(candidate.hologramSize, experienceCardDefaults.hologramSize, 28, 140),
    hologramPatternOpacity: clampedNumber(candidate.hologramPatternOpacity, experienceCardDefaults.hologramPatternOpacity, 0, 1),
    hologramReveal: clampedNumber(candidate.hologramReveal, experienceCardDefaults.hologramReveal, 0, 0.7),
    hologramAngle: clampedNumber(candidate.hologramAngle, experienceCardDefaults.hologramAngle, -90, 90),
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
    stage.style.setProperty('--hologram-size', `${settings.hologramSize}px`);
    stage.style.setProperty('--hologram-pattern-opacity', String(settings.hologramPatternOpacity));
    stage.style.setProperty('--hologram-reveal', String(settings.hologramReveal));
    stage.style.setProperty('--hologram-angle', `${settings.hologramAngle}deg`);
    card.dataset.tiltMax = String(settings.tiltMax);
    card.dataset.hoverScale = String(settings.hoverScale);
    card.dataset.motionDuration = String(settings.response);
    card.dataset.glareTravel = String(settings.glareTravel);
    card.dataset.autoMotionEnabled = String(settings.autoMotionEnabled);
    card.dataset.autoSweepDuration = String(settings.autoSweepDuration);
    card.dataset.autoTransitionDuration = String(settings.autoTransitionDuration);
    card.dataset.autoLoopDelay = String(settings.autoLoopDelay);
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
  const compactLayout = window.matchMedia('(max-width: 992px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-experience-card]:not([data-motion-mounted])'));
  if (!cards.length) return;

  import('gsap').then(({ gsap }) => {
    const autoPreview = cards.some((card) => card.dataset.autoPreview === 'true');
    if (!finePointer.matches || compactLayout.matches || autoPreview) {
      const bindings = cards.flatMap((card) => {
        const stage = card.closest<HTMLElement>('[data-experience-card-stage]');
        const glare = card.querySelector<HTMLElement>('[data-experience-glare]');
        const hologram = card.querySelector<HTMLElement>('[data-experience-hologram]');
        if (!stage || !glare) return [];

        card.dataset.motionMounted = 'true';
        gsap.set(card, { transformStyle: 'preserve-3d' });

        const surfaceEffects = hologram ? [glare, hologram] : [glare];
        const buildTimeline = () => {
          const tilt = Math.min(5.5, numberFrom(card.dataset.tiltMax, experienceCardDefaults.tiltMax) * 0.46);
          const scale = Math.min(1.012, numberFrom(card.dataset.hoverScale, experienceCardDefaults.hoverScale));
          const sweepDuration = numberFrom(card.dataset.autoSweepDuration, experienceCardDefaults.autoSweepDuration);
          const settleDuration = numberFrom(card.dataset.autoTransitionDuration, experienceCardDefaults.autoTransitionDuration);
          const loopDelay = numberFrom(card.dataset.autoLoopDelay, experienceCardDefaults.autoLoopDelay);
          const glareTravel = numberFrom(card.dataset.glareTravel, experienceCardDefaults.glareTravel);

          return gsap.timeline({ paused: true, repeat: -1, repeatDelay: loopDelay })
            .call(() => { card.dataset.pointerActive = 'true'; }, [], 0)
            .to(card, {
              rotationX: 1.6,
              rotationY: -tilt,
              scale,
              duration: settleDuration,
              ease: 'sine.inOut',
            }, 0)
            .to(surfaceEffects, {
              '--glare-x': `${50 - glareTravel}%`,
              '--glare-y': '48%',
              duration: settleDuration,
              ease: 'sine.inOut',
            }, 0)
            .to(card, {
              rotationX: -1.6,
              rotationY: tilt,
              scale,
              duration: sweepDuration,
              ease: 'sine.inOut',
            }, settleDuration)
            .to(surfaceEffects, {
              '--glare-x': `${50 + glareTravel}%`,
              '--glare-y': '52%',
              duration: sweepDuration,
              ease: 'sine.inOut',
            }, settleDuration)
            .call(() => { card.dataset.pointerActive = 'false'; }, [], settleDuration + sweepDuration)
            .to(card, {
              rotationX: 0,
              rotationY: 0,
              scale: 1,
              duration: settleDuration,
              ease: 'sine.inOut',
            }, settleDuration + sweepDuration)
            .to(surfaceEffects, {
              '--glare-x': '50%',
              '--glare-y': '50%',
              duration: settleDuration,
              ease: 'sine.inOut',
            }, settleDuration + sweepDuration);
        };

        let timeline = buildTimeline();
        return [{
          card,
          surfaceEffects,
          get timeline() { return timeline; },
          rebuildTimeline() {
            timeline.kill();
            timeline = buildTimeline();
          },
        }];
      });

      const visibility = new Map<HTMLElement, number>();
      let activeCard: HTMLElement | null = null;
      let manualCard: HTMLElement | null = null;
      let resumeTimer = 0;

      const reset = (binding: (typeof bindings)[number]) => {
        binding.timeline.pause(0);
        binding.card.dataset.pointerActive = 'false';
        gsap.set(binding.card, { rotationX: 0, rotationY: 0, scale: 1 });
        gsap.set(binding.surfaceEffects, { '--glare-x': '50%', '--glare-y': '50%' });
      };

      const activateNearestCard = () => {
        if (manualCard) return;
        const viewportCenter = window.innerHeight / 2;
        const next = bindings
          .filter(({ card }) => (visibility.get(card) ?? 0) >= 0.22)
          .sort((a, b) => {
            const aRect = a.card.getBoundingClientRect();
            const bRect = b.card.getBoundingClientRect();
            return Math.abs(aRect.top + aRect.height / 2 - viewportCenter)
              - Math.abs(bRect.top + bRect.height / 2 - viewportCenter);
          })[0];

        if (next?.card.dataset.autoMotionEnabled !== 'true') {
          bindings.forEach(reset);
          activeCard = null;
          return;
        }
        if (next?.card === activeCard) return;
        bindings.forEach(reset);
        activeCard = next?.card ?? null;
        if (next) {
          next.card.dataset.pointerActive = 'true';
          next.timeline.restart();
        }
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => visibility.set(entry.target as HTMLElement, entry.intersectionRatio));
        activateNearestCard();
      }, { threshold: [0, 0.22, 0.45, 0.7] });

      bindings.forEach(({ card }) => observer.observe(card));

      const syncAutomaticMotion = () => {
        activeCard = null;
        bindings.forEach((binding) => {
          reset(binding);
          binding.rebuildTimeline();
        });
        activateNearestCard();
      };
      window.addEventListener(EXPERIENCE_CARD_SETTINGS_EVENT, syncAutomaticMotion);

      if (finePointer.matches) {
        bindings.forEach((binding) => {
          let pointerFrame = 0;
          let latestPointer: PointerEvent | null = null;

          const renderPointer = () => {
            pointerFrame = 0;
            if (!latestPointer) return;

            const rect = binding.card.getBoundingClientRect();
            const x = Math.min(1, Math.max(-1, ((latestPointer.clientX - rect.left) / rect.width) * 2 - 1));
            const y = Math.min(1, Math.max(-1, ((latestPointer.clientY - rect.top) / rect.height) * 2 - 1));
            const tilt = numberFrom(binding.card.dataset.tiltMax, experienceCardDefaults.tiltMax);
            const scale = numberFrom(binding.card.dataset.hoverScale, experienceCardDefaults.hoverScale);
            const duration = numberFrom(binding.card.dataset.motionDuration, experienceCardDefaults.response);
            const glareTravel = numberFrom(binding.card.dataset.glareTravel, experienceCardDefaults.glareTravel);

            gsap.to(binding.card, {
              rotationX: -y * tilt,
              rotationY: x * tilt,
              scale,
              duration,
              ease: 'power3.out',
              overwrite: true,
            });
            gsap.to(binding.surfaceEffects, {
              '--glare-x': `${50 + x * glareTravel}%`,
              '--glare-y': `${50 + y * glareTravel}%`,
              duration: Math.max(0.18, duration * 0.78),
              ease: 'power2.out',
              overwrite: true,
            });
          };

          binding.card.addEventListener('pointerenter', () => {
            window.clearTimeout(resumeTimer);
            bindings.forEach(reset);
            manualCard = binding.card;
            activeCard = binding.card;
            binding.card.dataset.pointerActive = 'true';
          });
          binding.card.addEventListener('pointermove', (event) => {
            latestPointer = event;
            if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
          });
          binding.card.addEventListener('pointerleave', () => {
            latestPointer = null;
            if (pointerFrame) cancelAnimationFrame(pointerFrame);
            pointerFrame = 0;
            manualCard = null;
            activeCard = null;
            reset(binding);
            resumeTimer = window.setTimeout(activateNearestCard, 500);
          });
        });
      }
      return;
    }

    cards.forEach((card) => {
      card.dataset.motionMounted = 'true';
      const stage = card.closest<HTMLElement>('[data-experience-card-stage]');
      const glare = card.querySelector<HTMLElement>('[data-experience-glare]');
      const hologram = card.querySelector<HTMLElement>('[data-experience-hologram]');
      if (!stage || !glare) return;
      const surfaceEffects = hologram ? [glare, hologram] : [glare];

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
        gsap.to(surfaceEffects, {
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
        gsap.to(surfaceEffects, {
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
