import { useState, useEffect } from 'react';
import { ASCII_LOGO, BOOT_MESSAGES } from '../../lib/constants';

const BootSequence = () => {
  const [visibleMessages, setVisibleMessages] = useState<string[]>([]);

  useEffect(() => {
    // Animate boot messages appearing one by one
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < BOOT_MESSAGES.length) {
        setVisibleMessages(prev => [...prev, BOOT_MESSAGES[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="boot-sequence">
      {/* ASCII Logo */}
      <pre className="mb-4 text-terminal-green font-bold text-center animate-text-glow">
        {ASCII_LOGO}
      </pre>

      <div className="space-y-1 opacity-80">
        {visibleMessages.map((message, index) => (
          <p key={index} className={message.includes("NOTICE") ? "text-terminal-yellow" : ""}>
            {message}
          </p>
        ))}
      </div>
    </div>
  );
};

export default BootSequence;
