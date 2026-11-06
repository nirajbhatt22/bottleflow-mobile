import React, { ReactNode, createContext, useContext, useMemo, useState } from 'react';

type VerificationMethod = 'digital-id' | 'photo-id' | null;

type SessionContextValue = {
  ageVerified: boolean;
  verificationMethod: VerificationMethod;
  signedIn: boolean;
  hidePromotions: boolean;
  spendingReminder: boolean;
  purchasesPaused: boolean;
  verifyAge: (method: Exclude<VerificationMethod, null>) => void;
  signIn: () => void;
  signOut: () => void;
  setHidePromotions: (value: boolean) => void;
  setSpendingReminder: (value: boolean) => void;
  setPurchasesPaused: (value: boolean) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ageVerified, setAgeVerified] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [hidePromotions, setHidePromotions] = useState(true);
  const [spendingReminder, setSpendingReminder] = useState(true);
  const [purchasesPaused, setPurchasesPaused] = useState(false);

  const value = useMemo<SessionContextValue>(
    () => ({
      ageVerified,
      verificationMethod,
      signedIn,
      hidePromotions,
      spendingReminder,
      purchasesPaused,
      verifyAge: (method) => {
        setVerificationMethod(method);
        setAgeVerified(true);
      },
      signIn: () => setSignedIn(true),
      signOut: () => setSignedIn(false),
      setHidePromotions,
      setSpendingReminder,
      setPurchasesPaused,
    }),
    [ageVerified, hidePromotions, purchasesPaused, signedIn, spendingReminder, verificationMethod],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return value;
}
