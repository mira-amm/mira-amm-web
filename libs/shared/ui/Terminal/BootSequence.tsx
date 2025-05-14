import {useEffect, useState} from "react";
import {ASCII_LOGO, BOOT_MESSAGES} from "../../lib/constants";

const BootSequence = () => {
  const [visibleMessages, setVisibleMessages] = useState<string[]>([]);

  useEffect(() => {
    // Animate boot messages appearing one by one
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < BOOT_MESSAGES.length) {
        setVisibleMessages((prev) => [...prev, BOOT_MESSAGES[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="boot-sequence">
      <pre className="boot-logo text-terminal-green font-bold text-center">
        {ASCII_LOGO}
      </pre>

      <div className="boot-messages opacity-80">
        {BOOT_MESSAGES.map((message, index) => (
          <p
            key={index}
            className={`boot-message ${message.includes("NOTICE") ? "text-terminal-yellow" : ""}`}
          >
            {message}
          </p>
        ))}
      </div>
    </div>
  );
};

export default BootSequence;
