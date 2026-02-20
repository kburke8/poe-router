'use client';

import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTutorial } from './TutorialProvider';

const TOUR_ID = 'dashboard-tour';

export function DashboardTour() {
  const { hasSeenTour, markTourCompleted } = useTutorial();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run if not seen before, on client side, and after a small delay for page load
    if (!isClient || hasSeenTour(TOUR_ID)) return;
      const timer = setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          animate: true,
          smoothScroll: true,
          overlayColor: 'rgba(0, 0, 0, 0.85)',
          popoverClass: 'poe-tour-popover',
          allowClose: true,
          stagePadding: 4,
          allowKeyboardControl: true,
          onDestroyed: () => {
            markTourCompleted(TOUR_ID);
          },
          steps: [
            {
              popover: {
                title: 'Welcome to PoE Router!',
                description: 'A comprehensive campaign planning tool for Path of Exile 1. Let me show you around.',
                side: 'bottom',
                align: 'start',
              },
            },
            {
              element: '[data-tour-quick-actions]',
              popover: {
                title: 'Quick Actions',
                description: 'Start here to create your first build or generate regex patterns for vendor searching.',
                side: 'bottom',
              },
            },
            {
              element: '[data-tour-new-build]',
              popover: {
                title: 'Create Your First Build',
                description: 'Click here to create a new build. You can plan gem setups, gear goals, and track your campaign progress.',
                side: 'bottom',
              },
            },
            {
              element: '[data-tour-regex-builder]',
              popover: {
                title: 'Regex Builder',
                description: 'After creating a build, use this to generate optimized search patterns from your build\'s gems.',
                side: 'bottom',
              },
            },
            {
              element: '[data-tour-recent-builds]',
              popover: {
                title: 'Recent Builds',
                description: 'Your builds will appear here for quick access. Click any build to jump into the run view.',
                side: 'top',
              },
            },
            {
              element: '[data-tour-data-management]',
              popover: {
                title: 'Backup Your Data',
                description: 'Export your builds and presets as JSON for backup, or import data from another device.',
                side: 'top',
              },
            },
          ],
        });

        driverObj.drive();
      }, 800);

      return () => clearTimeout(timer);
  }, [isClient, hasSeenTour, markTourCompleted]);

  return null;
}