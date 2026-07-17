'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTutorial } from './TutorialProvider';

const TOUR_ID = 'build-editor-tour';

export function BuildEditorTour() {
  const { hasSeenTour, markTourCompleted, isReady } = useTutorial();

  useEffect(() => {
    // Only run after localStorage is loaded and if not seen before
    if (!isReady || hasSeenTour(TOUR_ID)) return;
    let cleanup: (() => void) | undefined;
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        overlayColor: 'rgba(0, 0, 0, 0.85)',
        popoverClass: 'poe-tour-popover',
        allowClose: true,
        // Fires on every exit path — completing, X, Esc, overlay click, and
        // the unmount cleanup below — so an early exit sticks like a finish.
        onDestroyed: () => {
          markTourCompleted(TOUR_ID);
        },
        steps: [
          {
            popover: {
              title: 'Route Canvas',
              description: 'Your whole route lives on this one page — every act and town stop, editable in place. No steps to click through.',
              side: 'bottom',
            },
          },
          {
            element: '[data-tour="route-rail"]',
            popover: {
              title: 'Route Rail',
              description: 'Jump to any act with one click. Your build summary lives at the bottom.',
              side: 'right',
            },
          },
          {
            element: '[data-tour="stop-row"]',
            popover: {
              title: 'Town Stops',
              description: 'Each row is a town stop showing what happens there. Click a row to expand it and edit gem pickups, link groups, inventory, and notes in place.',
              side: 'bottom',
            },
          },
          {
            element: '[data-tour="build-settings"]',
            popover: {
              title: 'Build Settings',
              description: 'Name, class, ascendancy, and regex generation live here. Mule and gear goals sit just below.',
              side: 'bottom',
            },
          },
          {
            element: '[data-tour="reimport-pob"]',
            popover: {
              title: 'Import from PoB',
              description: 'Paste a Path of Building link to generate the whole route automatically — then just review the few stops that need a call. Everything autosaves.',
              side: 'bottom',
            },
          },
        ],
      });

      // Only drive if the canvas actually rendered
      const checkElement = '[data-tour="route-rail"]';
      const start = () => {
        driverObj.drive();
        // Navigating away mid-tour unmounts without driver.js ever firing
        // onDestroyed — destroy it ourselves so the exit is recorded.
        cleanup = () => {
          if (driverObj.isActive()) driverObj.destroy();
        };
      };
      if (document.querySelector(checkElement)) {
        start();
      } else {
        // Wait a bit more for React to render
        setTimeout(() => {
          if (document.querySelector(checkElement)) {
            start();
          }
        }, 500);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, [isReady, hasSeenTour, markTourCompleted]);

  return null;
}
