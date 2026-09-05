export interface ExperienceCardSettings {
  tiltMax: number;
  hoverScale: number;
  perspective: number;
  response: number;
  artDepth: number;
  copyDepth: number;
  glareOpacity: number;
  glareTravel: number;
}

export const EXPERIENCE_CARD_SETTINGS_STORAGE_KEY = 'ace_experience_card_effects_v1';
export const EXPERIENCE_CARD_SETTINGS_EVENT = 'ace:experience-card-settings';

export const experienceCardDefaults: ExperienceCardSettings = {
  tiltMax: 12,
  hoverScale: 1.015,
  perspective: 2200,
  response: 0.9,
  artDepth: 96,
  copyDepth: 120,
  glareOpacity: 0.28,
  glareTravel: 48,
};
