import { ColorSchemeName, ImageSourcePropType } from 'react-native';

export const nothing = {
  red: '#D71921',
} as const;

export type AppTheme = {
  background: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderActive: string;
  buttonFill: string;
  buttonText: string;
  buttonPressedFill: string;
  buttonPressedText: string;
  dot: string;
  dotInactive: string;
  divider: string;
};

export const lightTheme: AppTheme = {
  background: '#FFFFFF',
  text: '#111111',
  textSecondary: '#666666',
  textMuted: '#AAAAAA',
  border: 'rgba(0,0,0,0.12)',
  borderActive: 'rgba(0,0,0,0.35)',
  buttonFill: 'transparent',
  buttonText: '#111111',
  buttonPressedFill: '#111111',
  buttonPressedText: '#FFFFFF',
  dot: '#111111',
  dotInactive: '#CCCCCC',
  divider: 'rgba(0,0,0,0.35)',
};

export const darkTheme: AppTheme = {
  background: '#000000',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#444444',
  border: 'rgba(255,255,255,0.18)',
  borderActive: 'rgba(255,255,255,0.45)',
  buttonFill: 'transparent',
  buttonText: '#FFFFFF',
  buttonPressedFill: '#FFFFFF',
  buttonPressedText: '#000000',
  dot: '#FFFFFF',
  dotInactive: '#444444',
  divider: 'rgba(255,255,255,0.45)',
};

const logos = {
  light: require('./assets/logo-dark.png') as ImageSourcePropType,
  dark: require('./assets/logo-light.png') as ImageSourcePropType,
};

export function getDeviceTheme(scheme: ColorSchemeName): AppTheme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export function getLogoForScheme(scheme: ColorSchemeName): ImageSourcePropType {
  return scheme === 'dark' ? logos.dark : logos.light;
}

export function isDarkScheme(scheme: ColorSchemeName): boolean {
  return scheme === 'dark';
}
