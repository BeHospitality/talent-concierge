import React, { createContext, useContext, useState, ReactNode } from "react";

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: true,
  toggleDemoMode: () => {},
});

export const useDemoMode = () => useContext(DemoModeContext);

export const DemoModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(true);
  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode: () => setIsDemoMode((p) => !p) }}>
      {children}
    </DemoModeContext.Provider>
  );
};
