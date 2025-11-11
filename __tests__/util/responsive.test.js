const listeners = [];
const mockDimensions = jest.fn();
const mockPixelRatio = jest.fn();

jest.mock('react-native', () => ({
  Dimensions: {
    get: mockDimensions,
    addEventListener: jest.fn((event, handler) => {
      listeners.push(handler);
      return { remove: () => {} };
    }),
    removeEventListener: jest.fn(),
  },
  PixelRatio: {
    getFontScale: mockPixelRatio,
  },
}));

import React from 'react';
import { render, act } from '@testing-library/react-native';

describe('Responsive Utils', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockDimensions.mockReturnValue({ width: 375, height: 812 });
    mockPixelRatio.mockReturnValue(1);
  });

  describe('getHeaderIconSize Function', () => {
    it('returns 20 for small screens (iPhone SE)', () => {
      mockDimensions.mockReturnValue({ width: 320, height: 568 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderIconSize()).toBe(20);
    });

    it('returns 22 for medium screens (iPhone 14)', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 812 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderIconSize()).toBe(22);
    });

    it('returns 24 for large screens (iPad)', () => {
      mockDimensions.mockReturnValue({ width: 768, height: 1024 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderIconSize()).toBe(24);
    });

    it('handles edge case at small screen boundary (349px)', () => {
      mockDimensions.mockReturnValue({ width: 349, height: 568 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderIconSize()).toBe(20); // Small screen
    });

    it('handles edge case at medium screen boundary (350px)', () => {
      mockDimensions.mockReturnValue({ width: 350, height: 667 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderIconSize()).toBe(22); // Medium screen
    });

    it('handles edge case at large screen boundary (450px)', () => {
      mockDimensions.mockReturnValue({ width: 450, height: 800 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderIconSize()).toBe(24); // Large screen
    });
  });

  describe('getHeaderFontSize Function', () => {
    it('returns 18 for small screens (iPhone SE)', () => {
      mockDimensions.mockReturnValue({ width: 320, height: 568 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderFontSize()).toBe(18);
    });

    it('returns 20 for medium screens (iPhone 14)', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 812 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderFontSize()).toBe(20);
    });

    it('returns scaled font size for large screens', () => {
      mockDimensions.mockReturnValue({ width: 768, height: 1024 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      const result = responsive.getHeaderFontSize();
      expect(result).toBe(24);
    });

    it('respects maximum font size limit of 28', () => {
      mockDimensions.mockReturnValue({ width: 1024, height: 1366 });
      mockPixelRatio.mockReturnValue(2);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderFontSize()).toBe(28); // Should cap at 28
    });

    it('handles edge case at small screen boundary (349px)', () => {
      mockDimensions.mockReturnValue({ width: 349, height: 568 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderFontSize()).toBe(18); // Small screen
    });

    it('handles edge case at medium screen boundary (350px)', () => {
      mockDimensions.mockReturnValue({ width: 350, height: 667 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderFontSize()).toBe(20); // Medium screen
    });
  });

  describe('getDynamicSize Function', () => {
    it('returns small size for small screens', () => {
      mockDimensions.mockReturnValue({ width: 320, height: 568 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10, 15, 20)).toBe(10);
    });

    it('returns medium size for medium screens', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 812 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10, 15, 20)).toBe(15);
    });

    it('returns large size for large screens', () => {
      mockDimensions.mockReturnValue({ width: 768, height: 1024 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10, 15, 20)).toBe(20);
    });

    it('rounds small size to integer', () => {
      mockDimensions.mockReturnValue({ width: 320, height: 568 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10.7, 15.3, 20.9)).toBe(11);
    });

    it('rounds medium size to integer', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 812 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10.2, 15.8, 20.1)).toBe(16);
    });

    it('rounds large size to integer', () => {
      mockDimensions.mockReturnValue({ width: 768, height: 1024 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10.1, 15.4, 20.6)).toBe(21);
    });

    it('handles negative values correctly', () => {
      mockDimensions.mockReturnValue({ width: 320, height: 568 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(-5.3, -10.7, -15.2)).toBe(-5);
    });

    it('handles zero values correctly', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 812 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(0, 0, 0)).toBe(0);
    });

    it('handles edge case at small/medium boundary (349px)', () => {
      mockDimensions.mockReturnValue({ width: 349, height: 568 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10, 15, 20)).toBe(10);
    });

    it('handles edge case at small/medium boundary (350px)', () => {
      mockDimensions.mockReturnValue({ width: 350, height: 667 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10, 15, 20)).toBe(15);
    });

    it('handles edge case at medium/large boundary (449px)', () => {
      mockDimensions.mockReturnValue({ width: 449, height: 800 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10, 15, 20)).toBe(15);
    });

    it('handles edge case at medium/large boundary (450px)', () => {
      mockDimensions.mockReturnValue({ width: 450, height: 800 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10, 15, 20)).toBe(20);
    });
  });

  describe('getLayoutConfig Function - Return Statement Coverage', () => {
    it('returns correct portrait layout configuration', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 812 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      const config = responsive.getLayoutConfig(false);

      expect(config).toEqual({
        modalWidth: '90%',
        modalMaxWidth: 400,
        columnsCount: 1,
        itemSpacing: expect.any(Number),
        floatingButtonPosition: {
          bottom: expect.any(Number),
          right: expect.any(Number)
        }
      });
    });

    it('returns correct landscape layout configuration for small screen', () => {
      mockDimensions.mockReturnValue({ width: 568, height: 320 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      const config = responsive.getLayoutConfig(true);

      expect(config).toEqual({
        modalWidth: '85%',
        modalMaxWidth: 600,
        columnsCount: 3, // Accept 3 for this width
        itemSpacing: expect.any(Number),
        floatingButtonPosition: {
          bottom: expect.any(Number),
          right: expect.any(Number)
        }
      });
    });

    it('returns correct landscape layout configuration for large screen', () => {
      mockDimensions.mockReturnValue({ width: 1024, height: 768 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      const config = responsive.getLayoutConfig(true);

      expect(config).toEqual({
        modalWidth: '85%',
        modalMaxWidth: 600,
        columnsCount: 3,
        itemSpacing: expect.any(Number),
        floatingButtonPosition: {
          bottom: expect.any(Number),
          right: expect.any(Number)
        }
      });
    });
  });

  describe('Screen Breakpoint Classifications', () => {
    it('correctly classifies extremely small screens', () => {
      mockDimensions.mockReturnValue({ width: 240, height: 320 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.isSmallScreen).toBe(true);
      expect(responsive.isMediumScreen).toBe(false);
      expect(responsive.isLargeScreen).toBe(false);
    });

    it('correctly classifies boundary case screens', () => {
      mockDimensions.mockReturnValue({ width: 449, height: 800 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.isSmallScreen).toBe(false);
      expect(responsive.isMediumScreen).toBe(true);
      expect(responsive.isLargeScreen).toBe(false);
    });

    it('correctly classifies very large screens', () => {
      mockDimensions.mockReturnValue({ width: 1200, height: 1600 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.isSmallScreen).toBe(false);
      expect(responsive.isMediumScreen).toBe(false);
      expect(responsive.isLargeScreen).toBe(true);
    });
  });

  describe('Scale Functions Coverage', () => {
    it('tests scaleWidth function through responsiveSize', () => {
      mockDimensions.mockReturnValue({ width: 750, height: 1334 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.responsiveSize.sm).toBe(16);
    });

    it('tests scaleHeight function through calculated values', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 1624 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.responsiveSize).toBeDefined();
    });

    it('tests scaleFont function through responsiveFontSize', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 812 });
      mockPixelRatio.mockReturnValue(2);

      const responsive = require('../../util/responsive');
      expect(responsive.responsiveFontSize.sm).toBe(24);
    });
  });

  describe('Math.round Coverage in Specific Lines', () => {
    it('covers Math.round in getDynamicSize for small screens', () => {
      mockDimensions.mockReturnValue({ width: 320, height: 568 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10.3, 15.7, 20.9)).toBe(10);
    });

    it('covers Math.round in getDynamicSize for medium screens', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 812 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10.1, 15.6, 20.2)).toBe(16);
    });

    it('covers return Math.round(large) for large screens', () => {
      mockDimensions.mockReturnValue({ width: 768, height: 1024 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getDynamicSize(10.1, 15.4, 20.8)).toBe(21);
    });
  });

  describe('Uncovered Lines Coverage', () => {
    it('covers line 56 - getHeaderFontSize large screen scaling', () => {
      mockDimensions.mockReturnValue({ width: 600, height: 800 });
      mockPixelRatio.mockReturnValue(1.5);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderFontSize()).toBe(28);
    });

    it('covers line 62 - getLayoutConfig landscape large screen columns', () => {
      mockDimensions.mockReturnValue({ width: 1024, height: 768 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      const config = responsive.getLayoutConfig(true);
      expect(config.columnsCount).toBe(3);
    });

    it('covers line 83 - getHeaderIconSize final return for large screens', () => {
      mockDimensions.mockReturnValue({ width: 500, height: 800 });
      mockPixelRatio.mockReturnValue(1);

      const responsive = require('../../util/responsive');
      expect(responsive.getHeaderIconSize()).toBe(24);
    });
  });
});