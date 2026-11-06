import { DefaultTheme, Theme } from '@react-navigation/native';
import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#5B2C83',
  primaryDark: '#3D1C59',
  primarySoft: '#EEE6F4',
  accent: '#F2B84B',
  accentSoft: '#FFF5DA',
  background: '#F7F7F9',
  surface: '#FFFFFF',
  text: '#171717',
  textSecondary: '#707070',
  border: '#E5E5EA',
  success: '#197A50',
  successSoft: '#E5F5ED',
  warning: '#A76300',
  warningSoft: '#FFF2D6',
  error: '#B63A43',
  errorSoft: '#FCE9EA',
  black: '#161118',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const type = {
  display: { fontFamily: 'Inter_800ExtraBold', fontSize: 32, lineHeight: 39 } as TextStyle,
  h1: { fontFamily: 'Inter_800ExtraBold', fontSize: 26, lineHeight: 33 } as TextStyle,
  h2: { fontFamily: 'Inter_700Bold', fontSize: 21, lineHeight: 27 } as TextStyle,
  h3: { fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 23 } as TextStyle,
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 } as TextStyle,
  bodyStrong: { fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 22 } as TextStyle,
  small: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 } as TextStyle,
  smallStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18 } as TextStyle,
  caption: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 15 } as TextStyle,
} as const;

export const shadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
  },
  android: { elevation: 3 },
  default: {},
});

export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};
