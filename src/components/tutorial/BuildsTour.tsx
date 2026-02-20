'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTutorial } from './TutorialProvider';

const TOUR_ID = 'builds-tour';

interface BuildsTourProps {
  hasBuilds: boolean;
}

export function BuildsTour({ hasBuilds }: BuildsTourProps) {
  const { hasSeenTour, markTourCompleted, isReady } = useTutorial();

  useEffect(() => {
    // Only run after localStorage is loaded and if not seen before
    if (!isReady || hasSeenTour(TOUR_ID)) return;
      const timer = setTimeout(() => {
        const steps = hasBuilds ? [
          {
            popover: {
              title: 'Your Builds',
              description: 'This is where all your builds are managed. Each build contains your complete campaign plan.',
              side: 'bottom' as const,
            },
          },
          {
            element: '[data-build-card]',
            popover: {
              title: 'Build Cards',
              description: 'Click any build to edit it. You can also export builds as JSON or delete them.',
              side: 'bottom' as const,
            },
          },
          {
            element: 'button',
            popover: {
              title: 'Create New Build',
              description: 'Start a fresh build from scratch with class selection and manual gem planning.',
              side: 'bottom' as const,
            },
          },
          {
            element: 'button:nth-of-type(2)',
            popover: {
              title: 'Import from Path of Building',
              description: 'Have a PoB build? Import it directly to auto-generate gem pickups and link groups.',
              side: 'bottom' as const,
            },
          },
          {
            element: 'button:nth-of-type(3)',
            popover: {
              title: 'Build Templates',
              description: 'Templates are coming soon! For now, start from scratch or import from PoB.',
              side: 'bottom' as const,
            },
          },
        ] : [
          {
            popover: {
              title: 'Welcome to Builds!',
              description: 'This is where you\'ll manage all your Path of Exile campaign builds.',
              side: 'bottom' as const,
            },
          },
          {
            element: 'button',
            popover: {
              title: 'Create Your First Build',
              description: 'Start by creating a new build. You\'ll choose your class and plan your gem progression.',
              side: 'bottom' as const,
            },
          },
          {
            element: 'button:nth-of-type(2)',
            popover: {
              title: 'Import Option',
              description: 'Already have a Path of Building build? Import it to automatically set up gem pickups.',
              side: 'bottom' as const,
            },
          },
          {
            element: 'button:nth-of-type(3)',
            popover: {
              title: 'Templates',
              description: 'Templates are coming soon! For now, start from scratch or import from PoB.',
              side: 'bottom' as const,
            },
          },
        ];

        const driverObj = driver({
          showProgress: true,
          animate: true,
          smoothScroll: true,
          overlayColor: 'rgba(0, 0, 0, 0.85)',
          popoverClass: 'poe-tour-popover',
          onDestroyed: () => {
            markTourCompleted(TOUR_ID);
          },
          steps,
        });

        driverObj.drive();
      }, 600);

      return () => clearTimeout(timer);
  }, [isReady, hasSeenTour, markTourCompleted, hasBuilds]);

  return null;
}