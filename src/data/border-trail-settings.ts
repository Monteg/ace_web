export interface BorderTrailSettings {
  orbitDuration: number;
  orbitLength: number;
  orbitWidth: number;
  orbitOpacity: number;
  orbitBlur: number;
}

export const BORDER_TRAIL_SETTINGS_STORAGE_KEY = 'ace_border_trail_effects_v1';
export const BORDER_TRAIL_SETTINGS_EVENT = 'ace:border-trail-settings';

export const borderTrailDefaults: BorderTrailSettings = {
  orbitDuration: 5,
  orbitLength: 60,
  orbitWidth: 1.5,
  orbitOpacity: 1,
  orbitBlur: 16,
};
