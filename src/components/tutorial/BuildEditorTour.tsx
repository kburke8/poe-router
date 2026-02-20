'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTutorial } from './TutorialProvider';

const TOUR_ID = 'build-editor-tour';

interface BuildEditorTourProps {
  mode: 'wizard' | 'advanced';
}

export function BuildEditorTour({ mode }: BuildEditorTourProps) {
  const { hasSeenTour, markTourCompleted, isReady } = useTutorial();

  useEffect(() => {
    // Only run after localStorage is loaded and if not seen before
    if (!isReady || hasSeenTour(TOUR_ID)) return;

    const timer = setTimeout(() => {
        const wizardSteps = [
          {
            popover: {
              title: 'Build Wizard',
              description: 'Welcome to the Build Wizard! This guided mode walks you through each town stop in order.',
              side: 'bottom' as const,
            },
          },
          {
            element: '[data-wizard-progress]',
            popover: {
              title: 'Progress Tracker',
              description: 'See your current position in the campaign. Each dot represents a town stop.',
              side: 'bottom' as const,
            },
          },
          {
            element: '[data-stop-header]',
            popover: {
              title: 'Current Stop',
              description: 'This shows which town you\'re planning for. Each stop has gem pickups and gear goals.',
              side: 'bottom' as const,
            },
          },
          {
            element: '[data-gem-pickups]',
            popover: {
              title: 'Gem Pickups',
              description: 'Add gems from quest rewards or vendors. The system knows what\'s available for your class.',
              side: 'left' as const,
            },
          },
          {
            element: '[data-inventory-panel]',
            popover: {
              title: 'Inventory Panel',
              description: 'See all gems you\'ve collected. Drop unwanted gems to free inventory space.',
              side: 'left' as const,
            },
          },
          {
            element: '[data-link-groups]',
            popover: {
              title: 'Link Groups',
              description: 'Configure your gem setups here. Each phase shows how your links evolve through the campaign.',
              side: 'top' as const,
            },
          },
          {
            element: '[data-mode-toggle]',
            popover: {
              title: 'Mode Toggle',
              description: 'Switch to Advanced mode for full control over all stops at once.',
              side: 'bottom' as const,
            },
          },
          {
            element: 'button:contains("Next"), button:contains("Previous")',
            popover: {
              title: 'Navigation',
              description: 'Use these buttons to move between stops, or click the progress dots to jump directly.',
              side: 'top' as const,
            },
          },
        ];

        const advancedSteps = [
          {
            popover: {
              title: 'Advanced Mode',
              description: 'In Advanced mode, you can see and edit all town stops at once.',
              side: 'bottom' as const,
            },
          },
          {
            element: '[data-build-header]',
            popover: {
              title: 'Build Settings',
              description: 'Configure your build name, class, and ascendancy here.',
              side: 'bottom' as const,
            },
          },
          {
            element: '[data-stop-section]',
            popover: {
              title: 'Town Stops',
              description: 'Each section represents a town stop. Enable/disable stops and configure gem pickups.',
              side: 'right' as const,
            },
          },
          {
            element: 'button:contains("Add Gem")',
            popover: {
              title: 'Adding Gems',
              description: 'Click to add gems from quest rewards or vendors. Only available gems are shown.',
              side: 'left' as const,
            },
          },
          {
            element: '[data-link-groups-panel]',
            popover: {
              title: 'Global Link Groups',
              description: 'Define your gem setups that persist across all stops.',
              side: 'left' as const,
            },
          },
          {
            element: '[data-mode-toggle]',
            popover: {
              title: 'Switch to Wizard',
              description: 'Prefer a guided experience? Switch to Wizard mode for step-by-step planning.',
              side: 'bottom' as const,
            },
          },
        ];

        const steps = mode === 'wizard' ? wizardSteps : advancedSteps;

        const driverObj = driver({
          showProgress: true,
          animate: true,
          smoothScroll: true,
          overlayColor: 'rgba(0, 0, 0, 0.85)',
          popoverClass: 'poe-tour-popover',
          allowClose: true,
          onDestroyed: () => {
            markTourCompleted(TOUR_ID);
          },
          steps,
        });

        // Only drive if we have the expected elements
        const checkElement = mode === 'wizard' ? '[data-wizard-progress]' : '[data-build-header]';
        if (document.querySelector(checkElement)) {
          driverObj.drive();
        } else {
          // Wait a bit more for React to render
          setTimeout(() => {
            if (document.querySelector(checkElement)) {
              driverObj.drive();
            }
          }, 500);
        }
      }, 1000);

    return () => clearTimeout(timer);
  }, [isReady, hasSeenTour, markTourCompleted, mode]);

  return null;
}