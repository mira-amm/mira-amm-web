// Terminal constants
export const CORRECT_PASSWORD = "blockchain";

// Commands
export const COMMANDS = {
  NOTES: "notes",
  TIMER: "timer",
  GAME: "game",
  HELP: "help",
  CLEAR: "clear",
  LOGOUT: "logout"
};

// Boot sequence messages for DLM-2000 prototype
export const BOOT_MESSAGES = [
  "> LOADING MICROCHAIN DLM-2000 PROTOTYPE v1.9.8.5...",
  "> INITIALIZING 640K MEMORY BANKS...... OK",
  "> SYSTEM CHECK: 5.25\" FLOPPY DRIVE... READY",
  "> LOADING DECENTRALIZED FINANCE MODULE...",
  "> BLOCKCHAIN GRID RENDERING... CONFIRMED!",
  "> WALL STREET NETWORK HANDSHAKE ESTABLISHED",
  "> WELCOME T-REX CEO: DEREK DINO",
  "> WARNING: CLASSIFIED PROJECT DATA",
  "> SECURITY CLEARANCE REQUIRED - ENTER PASSWORD"
];

// ASCII Logo
export const ASCII_LOGO = `
   __  __ _               _____  _           _         _____  _      __  __      __   ___ ___ ___ ___ 
  |  \\/  (_) ___ _ __ ___| ____|/ \\   _ __ | |_ __   |  __ \\| |    |  \\/  |_   / /  |_  |   |   |   |
  | |\\/| | |/ __| '__/ _ | |__ / _ \\ | '_ \\| __/ _\\  | |  | | |    | |\\/| | | / /     | |___|___|___|
  | |  | | | (__| | | (_) |___ / ___ \\| | | | || (_) | |__| | |___ | |  | | |/ /   _  | |   |   |   |
  |_|  |_|_|\\___|_|  \\___\\____/_/   \\_\\_| |_|\\__\\__/  |_____/|_____|_|  |_| /_/   (_)|___|___|___|___|
                     T-REX TECHNOLOGIES    DLM-2000 PROTOTYPE    CEO: DEREK DINO
                                                                                `;

// Derek Dino's confidential project files
export const SECRET_NOTES = [
  {
    date: "1985-03-12",
    content: "President Reagan's Digital Assets Deregulation Act is working in our favor. The freedom to operate without government intervention gives us a clear advantage. The DLM-2000 prototype is progressing ahead of schedule. Fossil Frank has outdone himself again."
  },
  {
    date: "1985-06-24",
    content: "Met with the Velociraptor hedge fund managers today. They're eager to be early adopters of the DLM-2000. Their aggressive trading style makes them perfect beta testers. Brian Bronto's connections continue to pay dividends - his disco-era networking is unmatched."
  },
  {
    date: "1985-09-18",
    content: "Breakthrough on the permissionless trading algorithm! Our tests show zero slippage even with Brontosaurus-sized trades. This will revolutionize Wall Street. The traditional Dino exchanges won't know what hit them. Keeping this TOP SECRET until launch."
  },
  {
    date: "1985-11-03",
    content: "URGENT: Possible corporate espionage detected. Suspicious T-Rex footprints found near R&D lab. Rival Dino firms getting desperate as our launch approaches. Implementing additional security protocols. TRUST NO ONE OUTSIDE THE CORE TEAM!",
    isHighlighted: true
  }
];

// Available commands help text
export const HELP_TEXT = [
  "AVAILABLE COMMANDS - T-REX EXECUTIVE ACCESS:",
  "- notes: Access Derek Dino's confidential project files",
  "- timer: View DLM-2000 product launch countdown",
  "- game: Test the Decentralized Market Simulator",
  "- clear: Purge screen data [CLASSIFIED]", 
  "- logout: Engage T-REX security lockdown"
];

// Game instructions
export const GAME_INSTRUCTIONS = [
  "> USE TRADING JOYSTICK TO NAVIGATE MARKETS",
  "> PRESS TRANSACTION BUTTON (SPACEBAR) TO EXECUTE TRADES",
  "> COLLECT BLOCKCHAIN ASSETS WHILE AVOIDING REGULATORY OBSTACLES",
  "> HIGHER SCORES EARN BETTER COMMISSION MULTIPLIERS!"
];

// Launch date (2 weeks from now for the countdown)
export const LAUNCH_DATE = new Date();
LAUNCH_DATE.setDate(LAUNCH_DATE.getDate() + 14);
