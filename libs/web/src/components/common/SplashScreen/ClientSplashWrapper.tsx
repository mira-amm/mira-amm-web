"use client";
import {useEffect, useState} from "react";
import {ClientSplashScreen} from "./ClientSplashScreen";

interface ClientSplashWrapperProps {
  children: React.ReactNode;
}

export const ClientSplashWrapper = ({children}: ClientSplashWrapperProps) => {
  const [isContentReady, setIsContentReady] = useState(false);
  const [showSplash, setShowSplash] = useState(false); // Start with false to match server

  useEffect(() => {
    // Check if this is an initial page load
    const isInitialLoad =
      !window.performance?.navigation?.type ||
      window.performance.navigation.type === 1;

    if (!isInitialLoad) {
      // If it's not an initial load, show content immediately
      setShowSplash(false);
      setIsContentReady(true);
      return;
    }

    // For initial loads, show splash and prepare content in background
    setShowSplash(true);
    const timer = setTimeout(() => {
      setIsContentReady(true);
    }, 1000); // 1 second delay to allow background loading

    return () => clearTimeout(timer);
  }, []);

  // Hide splash after it completes (4 seconds)
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 4000); // Match the splash duration

      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  return (
    <>
      {/* Main content - always rendered but controlled visibility */}
      <div
        className={`transition-opacity duration-500 ${
          isContentReady ? "opacity-100" : "opacity-0"
        }`}
        style={{
          visibility: isContentReady ? "visible" : "hidden",
        }}
      >
        {children}
      </div>

      {/* Splash screen */}
      {showSplash && <ClientSplashScreen />}
    </>
  );
};
