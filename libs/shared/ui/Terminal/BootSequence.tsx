import { motion } from "motion/react"

const ASCII_LOGO = `
    __  ____                      __          _          ____  __    __  ___   __  ___   ____  ____  ____
   /  |/  (_)_____________  _____/ /_  ____ _(_)___     / __ \\/ /   /  |/  / _/_/ |__ \\ / __ \\/ __ \\/ __ \\
  / /|_/ / / ___/ ___/ __ \\/ ___/ __ \\/ __ \`/ / __ \\   / / / / /   / /|_/ /_/_/   __/ // / / / / / / / / /
 / /  / / / /__/ /  / /_/ / /__/ / / / /_/ / / / / /  / /_/ / /___/ /  / //_/  _ / __// /_/ / /_/ / /_/ /
/_/  /_/_/\\___/_/   \\____/\\___/_/ /_/\\__,_/_/_/ /_/  /_____/_____/_/  /_/_/   (_)____/\\____/\\____/\\____/
                     T-REX TECHNOLOGIES    DLM-2000 PROTOTYPE    CEO: DEREK DINO `;


const BOOT_MESSAGES = [
  "> LOADING MICROCHAIN DLM-2000 PROTOTYPE v1.9.8.5...",
  "> INITIALIZING 640K MEMORY BANKS...... OK",
  '> SYSTEM CHECK: 5.25" FLOPPY DRIVE... READY',
  "> LOADING DECENTRALIZED FINANCE MODULE...",
  "> BLOCKCHAIN GRID RENDERING... CONFIRMED!",
  "> WALL STREET NETWORK HANDSHAKE ESTABLISHED",
  "> WELCOME T-REX CEO: DEREK DINO",
  "> WARNING: CLASSIFIED PROJECT DATA",
  "> SECURITY CLEARANCE REQUIRED - ENTER PASSWORD",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 0 },
  visible: { opacity: 1, x: 0 },
};

export const BootSequence = () => {
  return (
    <>
      <pre className="text-terminal-green font-bold text-center">
        {ASCII_LOGO}
      </pre>

      <motion.div
        className="opacity-80"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {BOOT_MESSAGES.map((message, index) => (
          <motion.p
            key={index}
            variants={itemVariants}
            className={`${message.includes("NOTICE") ? "text-terminal-yellow" : ""}`}
          >
            {message}
          </motion.p>
        ))}
      </motion.div>
    </>
  );
};
