import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './use-auth';

interface OnboardingContextProps {
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextProps | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const { user } = useAuth();

  // Effect to check localStorage for onboarding status
  useEffect(() => {
    if (user) {
      const onboardingStatus = localStorage.getItem(`onboarding-completed-${user.id}`);
      setHasCompletedOnboarding(onboardingStatus === 'true');
      
      // If user is logged in and hasn't completed onboarding, show the onboarding wizard
      if (onboardingStatus !== 'true') {
        setIsOnboardingOpen(true);
      }
    }
  }, [user]);

  // Function to mark onboarding as completed
  const completeOnboarding = (value: boolean) => {
    setHasCompletedOnboarding(value);
    
    if (user) {
      localStorage.setItem(`onboarding-completed-${user.id}`, value.toString());
    }
  };

  const openOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  const closeOnboarding = () => {
    setIsOnboardingOpen(false);
    completeOnboarding(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        setHasCompletedOnboarding: completeOnboarding,
        isOnboardingOpen,
        openOnboarding,
        closeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
}