import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { WelcomeStep } from './welcome-step';
import { MasterPasswordStep } from './master-password-step';
import { ProviderSetupStep } from './provider-setup-step';
import { CompletionStep } from './completion-step';

type Step = 'welcome' | 'password' | 'providers' | 'complete';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [masterPassword, setMasterPassword] = useState('');
  const [providers, setProviders] = useState<any[]>([]);

  const steps: Step[] = ['welcome', 'password', 'providers', 'complete'];
  const currentIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    const nextStep = steps[currentIndex + 1];
    if (nextStep) setCurrentStep(nextStep);
  };

  const handleBack = () => {
    const prevStep = steps[currentIndex - 1];
    if (prevStep) setCurrentStep(prevStep);
  };

  const handlePasswordSet = (password: string) => {
    setMasterPassword(password);
    handleNext();
  };

  const handleProvidersConfigured = (configuredProviders: any[]) => {
    setProviders(configuredProviders);
    handleNext();
  };

  const handleComplete = async () => {
    try {
      // Check if running in Tauri context
      const isTauri = typeof window !== 'undefined' && window.__TAURI__;

      if (isTauri) {
        // Unlock the app with the master password
        await invoke('unlock_app', { password: masterPassword });

        // Mark onboarding as completed
        await invoke('complete_onboarding');
      } else {
        console.log('[Onboarding] Web mode: skipping Tauri commands');
      }

      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Progress bar */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between px-6 py-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
                  index <= currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 transition-colors ${
                    index < currentIndex ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentStep === 'welcome' && (
            <WelcomeStep onNext={handleNext} />
          )}

          {currentStep === 'password' && (
            <MasterPasswordStep
              onNext={handlePasswordSet}
              onBack={handleBack}
            />
          )}

          {currentStep === 'providers' && (
            <ProviderSetupStep
              onNext={handleProvidersConfigured}
              onBack={handleBack}
            />
          )}

          {currentStep === 'complete' && (
            <CompletionStep
              onComplete={handleComplete}
              providers={providers}
            />
          )}
        </div>
      </div>
    </div>
  );
}
