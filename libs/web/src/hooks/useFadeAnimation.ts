import {useState, useEffect} from "react";

// Custom hook for fade-out animation
export const useFadeAnimation = (shouldShow: boolean, delay: number = 300) => {
  const [isVisible, setIsVisible] = useState(shouldShow);
  const [shouldRender, setShouldRender] = useState(shouldShow);

  useEffect(() => {
    if (shouldShow) {
      setShouldRender(true);
      // Small delay to ensure DOM element is rendered before animating in
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, delay]);

  return {isVisible, shouldRender};
};
