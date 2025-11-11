import { Dimensions, PixelRatio } from 'react-native';
import { useEffect,useState } from 'react';

export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window: { width, height } }) => {
      setIsLandscape(width > height);
    });
    return () => {
      // Remove the subscription correctly for RN >= 0.65
      if (typeof subscription?.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);

  return isLandscape;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (design reference)
const baseWidth = 375; // iPhone design width
const baseHeight = 812; // iPhone design height


// Scale functions - ROUNDED TO INTEGERS
export const scaleWidth = (size) => Math.round((screenWidth / baseWidth) * size);
export const scaleHeight = (size) => Math.round((screenHeight / baseHeight) * size);
export const scaleFont = (size) => Math.round(size * PixelRatio.getFontScale());

// Responsive padding/margin - ALL INTEGERS
export const responsiveSize = {
  xs: Math.max(4, scaleWidth(4)),   // Minimum 4pt
  sm: Math.max(8, scaleWidth(8)),   // Minimum 8pt
  md: Math.max(12, scaleWidth(12)), // Minimum 12pt
  lg: Math.max(16, scaleWidth(16)), // Minimum 16pt
  xl: Math.max(20, scaleWidth(20)), // Minimum 20pt
  xxl: Math.max(24, scaleWidth(24)), // Minimum 24pt
};

// Responsive font sizes - ALL INTEGERS
export const responsiveFontSize = {
  xs: Math.max(10, scaleFont(10)),
  sm: Math.max(12, scaleFont(12)),
  md: Math.max(14, scaleFont(14)),
  lg: Math.max(16, scaleFont(16)),
  xl: Math.max(18, scaleFont(18)),
  xxl: Math.max(20, scaleFont(20)),
  title: Math.max(22, scaleFont(22)), // SMALLER base size for headers
  header: Math.max(26, scaleFont(26)),
};

// Screen breakpoints
export const isSmallScreen = screenWidth < 350;
export const isMediumScreen = screenWidth >= 350 && screenWidth < 450;
export const isLargeScreen = screenWidth >= 450;

// Dynamic sizing based on screen
export const getDynamicSize = (small, medium, large) => {
  if (isSmallScreen) return Math.round(small);
  if (isMediumScreen) return Math.round(medium);
  return Math.round(large);
};

// BETTER: Device-specific header font sizes
export const getHeaderFontSize = () => {
  if (isSmallScreen) return 18;        // iPhone SE: 18pt
  if (isMediumScreen) return 20;       // iPhone 14: 20pt  
  return Math.min(28, scaleFont(24));  // iPad: 24pt scaled, max 28pt
};

// Orientation-specific layouts
export const getLayoutConfig = (isLandscape) => {
  if (isLandscape) {
    return {
      modalWidth: '85%',
      modalMaxWidth: 600,
      columnsCount: isLargeScreen ? 3 : 2,
      itemSpacing: responsiveSize.md,
      floatingButtonPosition: { bottom: responsiveSize.lg, right: responsiveSize.lg }
    };
  } else {
    return {
      modalWidth: '90%',
      modalMaxWidth: 400,
      columnsCount: 1,
      itemSpacing: responsiveSize.lg,
      floatingButtonPosition: { bottom: responsiveSize.xxl, right: responsiveSize.xxl }
    };
  }
};

export const getHeaderIconSize = () => {
  if (isSmallScreen) return 20;        // iPhone SE: 20pt
  if (isMediumScreen) return 22;       // iPhone 14: 22pt  
  return 24;                           // iPad: 18pt (smaller for proper fit)
};