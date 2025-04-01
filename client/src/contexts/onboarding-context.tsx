import { createContext, useContext, useState, ReactNode } from "react";

interface OnboardingContextType {
  isOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openOnboarding = () => setIsOpen(true);
  const closeOnboarding = () => {
    setIsOpen(false);
    
    // Get the current user ID from localStorage
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
      localStorage.setItem(`onboarding-completed-${userId}`, 'true');
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOpen,
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
  if (!context) {
    // Create a temporary stub context when used outside provider
    // This prevents app from crashing if used outside provider
    return {
      isOpen: false,
      openOnboarding: () => console.warn("Onboarding provider not properly initialized"),
      closeOnboarding: () => console.warn("Onboarding provider not properly initialized")
    };
  }
  return context;
}