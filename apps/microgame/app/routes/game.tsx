import { useEffect } from "react";
import { MiniGame } from "@/shared/ui/Terminal/MiniGame";

export default function GamePage() {
  useEffect(() => {
   const preventScrollKeys = (e: KeyboardEvent) => {
     const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'];
     if (keys.includes(e.key)) {
       e.preventDefault();
     }
   };

   window.addEventListener('keydown', preventScrollKeys, { passive: false });

   return () => {
     window.removeEventListener('keydown', preventScrollKeys);
   };
 }, []);

  return <MiniGame />;
}
