'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TutorialContextType {
  hasSeenTour: (tourId: string) => boolean;
  markTourCompleted: (tourId: string) => void;
  resetTour: (tourId: string) => void;
  resetAllTours: () => void;
  isGloballyDisabled: boolean;
  setGloballyDisabled: (disabled: boolean) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [completedTours, setCompletedTours] = useState<Set<string>>(new Set());
  const [isGloballyDisabled, setIsGloballyDisabled] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('tutorial-completed-tours');
    if (stored) {
      try {
        const tours = JSON.parse(stored) as string[];
        setCompletedTours(new Set(tours));
      } catch {
        // Invalid data, ignore
      }
    }

    const disabled = localStorage.getItem('tutorial-disabled') === 'true';
    setIsGloballyDisabled(disabled);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('tutorial-completed-tours', JSON.stringify(Array.from(completedTours)));
  }, [completedTours]);

  useEffect(() => {
    localStorage.setItem('tutorial-disabled', String(isGloballyDisabled));
  }, [isGloballyDisabled]);

  const hasSeenTour = (tourId: string) => {
    return isGloballyDisabled || completedTours.has(tourId);
  };

  const markTourCompleted = (tourId: string) => {
    setCompletedTours(prev => new Set([...prev, tourId]));
  };

  const resetTour = (tourId: string) => {
    setCompletedTours(prev => {
      const next = new Set(prev);
      next.delete(tourId);
      return next;
    });
  };

  const resetAllTours = () => {
    setCompletedTours(new Set());
    setIsGloballyDisabled(false);
  };

  const setGloballyDisabledWrapper = (disabled: boolean) => {
    setIsGloballyDisabled(disabled);
  };

  return (
    <TutorialContext.Provider
      value={{
        hasSeenTour,
        markTourCompleted,
        resetTour,
        resetAllTours,
        isGloballyDisabled,
        setGloballyDisabled: setGloballyDisabledWrapper,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}