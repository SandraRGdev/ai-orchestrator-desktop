import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

// Check if running in Tauri context
const isTauri = () => {
  return typeof window !== 'undefined' && window.__TAURI__;
};

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        setIsLoading(true);
        // Skip onboarding in web/dev mode
        if (!isTauri()) {
          setNeedsOnboarding(false);
          setError(null);
          setIsLoading(false);
          return;
        }
        const completed = await invoke<boolean>('is_onboarding_completed');
        setNeedsOnboarding(!completed);
        setError(null);
      } catch (err: any) {
        console.error('Failed to check onboarding status:', err);
        setError(err.toString());
        // Default to showing onboarding if there's an error
        setNeedsOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const completeOnboarding = async () => {
    try {
      if (!isTauri()) {
        setNeedsOnboarding(false);
        return;
      }
      await invoke('complete_onboarding');
      setNeedsOnboarding(false);
      setError(null);
    } catch (err: any) {
      console.error('Failed to complete onboarding:', err);
      setError(err.toString());
      throw err;
    }
  };

  return {
    isLoading,
    needsOnboarding,
    error,
    completeOnboarding
  };
}
