/**
 * GreenPulse Mobile Store - Green & White Palette & Design System
 */
export const Colors = {
  // Primary Greens
  primary: '#10B981',       // Emerald 500
  primaryDark: '#059669',   // Emerald 600
  primaryDeep: '#064E3B',   // Emerald 900 (Header & Hero)
  primaryDarker: '#022C22', // Emerald 950
  primaryLight: '#34D399',  // Emerald 400
  
  // Background & Surfaces
  background: '#F8FAFC',    // Soft light background
  surface: '#FFFFFF',       // Pure white card background
  surfaceAlt: '#ECFDF5',    // Mint Frost tint
  surfaceBorder: '#E2E8F0', // Card borders
  greenBorder: '#A7F3D0',   // Mint border

  // Text colors
  textPrimary: '#0F172A',   // Slate 900
  textSecondary: '#64748B', // Slate 500
  textLight: '#94A3B8',     // Slate 400
  textWhite: '#FFFFFF',
  textGreen: '#047857',     // Dark green text

  // Accents
  accentOrange: '#FF9933',  // India flag saffron
  accentGreen: '#138808',   // India flag green
  accentNavy: '#000080',    // Ashoka Chakra blue
  ratingStar: '#F59E0B',    // Amber gold
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

export const FormatINR = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};
