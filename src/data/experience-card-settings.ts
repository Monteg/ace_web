export interface ExperienceCardSettings {
  autoMotionEnabled: boolean;
  tiltMax: number;
  hoverScale: number;
  perspective: number;
  response: number;
  autoSweepDuration: number;
  autoTransitionDuration: number;
  autoLoopDelay: number;
  artDepth: number;
  copyDepth: number;
  glareOpacity: number;
  glareTravel: number;
  hologramSize: number;
  hologramPatternOpacity: number;
  hologramReveal: number;
  hologramAngle: number;
}

export const EXPERIENCE_CARD_SETTINGS_STORAGE_KEY = 'ace_experience_card_effects_v1';
export const EXPERIENCE_CARD_SETTINGS_EVENT = 'ace:experience-card-settings';

export const experienceCardDefaults: ExperienceCardSettings = {
  autoMotionEnabled: true,
  tiltMax: 12,
  hoverScale: 1.015,
  perspective: 2200,
  response: 0.9,
  autoSweepDuration: 3.15,
  autoTransitionDuration: 0.8,
  autoLoopDelay: 0.8,
  artDepth: 96,
  copyDepth: 120,
  glareOpacity: 0.28,
  glareTravel: 48,
  hologramSize: 56,
  hologramPatternOpacity: 0.58,
  hologramReveal: 0.22,
  hologramAngle: 35,
};
