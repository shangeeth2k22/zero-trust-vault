import { Platform } from 'react-native';

// Standard base URL for local development (Android Emulator: 10.0.2.2, iOS: localhost)
export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export const COLORS = {
  bgLight: '#EBF0F8',
  bgCard: '#FFFFFF',
  glassBg: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.9)',
  glassHeroBg: 'rgba(49, 35, 160, 0.92)',
  glassHeroBorder: 'rgba(255, 255, 255, 0.28)',
  purplePrimary: '#372BAC',
  purpleAccent: '#5B46F6',
  purpleLight: '#EEECFE',
  purpleHero: '#3123A0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  danger: '#EF4444',
};
