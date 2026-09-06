export interface GameCardSettings {
  quickPlayEnabled: boolean;
  hoverScale: number;
  hoverLift: number;
  motionDuration: number;
  backgroundScale: number;
  backgroundOpacity: number;
  logoScale: number;
  logoShiftX: number;
  logoLift: number;
  playPosition: number;
  playTravel: number;
  buttonHoverScale: number;
  mobileBackgroundOpacity: number;
  mobileLogoLift: number;
  shadeHeight: number;
  shadeOpacity: number;
  shadeBlur: number;
  borderWidth: number;
  borderOpacity: number;
  cornerRadius: number;
}

export const GAME_CARD_SETTINGS_STORAGE_KEY = 'ace_game_card_effects_v1';
export const GAME_CARD_SETTINGS_EVENT = 'ace:game-card-settings';

export const gameCardDefaults: GameCardSettings = {
  quickPlayEnabled: true,
  hoverScale: 1.015,
  hoverLift: 6,
  motionDuration: 1.2,
  backgroundScale: 1.035,
  backgroundOpacity: 0.3,
  logoScale: 1.205,
  logoShiftX: -10.2,
  logoLift: 35,
  playPosition: 54.7,
  playTravel: 25,
  buttonHoverScale: 1.055,
  mobileBackgroundOpacity: 0.82,
  mobileLogoLift: 20,
  shadeHeight: 65,
  shadeOpacity: 0.6,
  shadeBlur: 30,
  borderWidth: 1.5,
  borderOpacity: 1,
  cornerRadius: 14,
};
