import {useState, useRef, useEffect, useCallback} from "react";
import {COMMANDS, CORRECT_PASSWORD, HELP_TEXT} from "../lib/constants";
import crypto from "crypto";
import {get} from "http";

export type TerminalView =
  | "boot"
  | "passwordPrompt"
  | "authenticated"
  | "notes"
  | "timer"
  | "game";

interface TerminalState {
  isAuthenticated: boolean;
  currentView: TerminalView;
  commandHistory: string[];
  commandOutputs: string[];
  currentScore: number;
  highScore: number;
  multiplier: number;
  gameActive: boolean;
  walletAddress: string;
  leaderboard: {id: string; wallet: string; score: number}[];
}

const getLocalStorageHighScore = () => {
  const highScore =
    typeof localStorage !== "undefined" ? localStorage.getItem("hiScore") : 0;
  return highScore ? parseInt(highScore) : 0;
};

export function useTerminal({leaderBoardData}: any) {
  const [state, setState] = useState<TerminalState>({
    isAuthenticated: false,
    currentView: "boot",
    commandHistory: [],
    commandOutputs: [],
    currentScore: 0,
    highScore: getLocalStorageHighScore(),
    multiplier: 1,
    gameActive: false,
    walletAddress: "",
    leaderboard: leaderBoardData,
  });

  const commandInputRef = useRef<HTMLInputElement>(null);

  // Boot sequence effect
  useEffect(() => {
    // After 2 seconds, move from boot to password prompt
    const timer = setTimeout(() => {
      setState((prevState) => ({
        ...prevState,
        currentView: "passwordPrompt",
      }));
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Focus command input whenever authenticated terminal is shown
  useEffect(() => {
    if (state.currentView === "authenticated" && commandInputRef.current) {
      commandInputRef.current.focus();
    }
  }, [state.currentView]);

  // Handle password validation
  const validatePassword = useCallback((password: string) => {
    if (password.toLowerCase() === CORRECT_PASSWORD) {
      setState((prevState) => ({
        ...prevState,
        isAuthenticated: true,
        currentView: "authenticated",
        commandOutputs: [
          ...prevState.commandOutputs,
          "Authentication successful. Welcome to MICROCHAIN SYSTEMS.",
          "Type 'help' to see available commands.",
        ],
      }));
      return true;
    }
    return false;
  }, []);

  // Handle terminal commands
  const processCommand = useCallback((command: string) => {
    const cmd = command.toLowerCase().trim();

    // Add command to history
    setState((prevState) => ({
      ...prevState,
      commandHistory: [...prevState.commandHistory, cmd],
      commandOutputs: [...prevState.commandOutputs, `> ${cmd}`],
    }));

    // Process different commands
    switch (cmd) {
      case COMMANDS.HELP:
        setState((prevState) => ({
          ...prevState,
          commandOutputs: [...prevState.commandOutputs, ...HELP_TEXT],
        }));
        break;

      case COMMANDS.NOTES:
        setState((prevState) => ({
          ...prevState,
          currentView: "notes",
        }));
        break;

      case COMMANDS.TIMER:
        setState((prevState) => ({
          ...prevState,
          currentView: "timer",
        }));
        break;

      case COMMANDS.GAME:
        setState((prevState) => ({
          ...prevState,
          currentView: "game",
          gameActive: false,
          currentScore: 0,
        }));
        break;

      case COMMANDS.CLEAR:
        setState((prevState) => ({
          ...prevState,
          commandOutputs: [],
        }));
        break;

      case COMMANDS.LOGOUT:
        setState((prevState) => ({
          ...prevState,
          isAuthenticated: false,
          currentView: "passwordPrompt",
          commandOutputs: [],
        }));
        break;

      default:
        setState((prevState) => ({
          ...prevState,
          commandOutputs: [
            ...prevState.commandOutputs,
            `Command not recognized: '${cmd}'`,
            "Type 'help' to see available commands.",
          ],
        }));
    }
  }, []);

  // Handle return to terminal from detail views
  const returnToTerminal = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      currentView: "authenticated",
    }));

    if (commandInputRef.current) {
      commandInputRef.current.focus();
    }
  }, []);

  // Start game function
  const startGame = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      gameActive: true,
      currentScore: 0,
      multiplier: 1,
    }));
  }, []);

  // Update game score (placeholder for actual game mechanics)
  const updateGameScore = useCallback((points: number) => {
    setState((prevState) => {
      // const newScore = prevState.currentScore + (points * prevState.multiplier);
      // const newHighScore = newScore > prevState.highScore ? newScore : prevState.highScore;

      return {
        ...prevState,
        currentScore: points,
        // highScore: newHighScore,
        // Increase multiplier as score increases
        // multiplier: Math.floor(newScore / 1000) + 1
      };
    });
  }, []);

  // End game and check for high score
  const endGame = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      gameActive: false,
      highScore: getLocalStorageHighScore(),
    }));
  }, []);

  // Submit wallet address
  const submitWalletAddress = useCallback((wallet: string) => {
    if (wallet && wallet.startsWith("0x") && wallet.length >= 10) {
      // In a real app, this would submit to the server
      setState((prevState) => {
        // Create a new leaderboard with the current wallet/score
        const newLeaderboard = [
          ...prevState.leaderboard,
          {
            id: crypto.randomBytes(16).toString("hex"),
            wallet: wallet,
            score: prevState.currentScore,
          },
        ]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Keep top 10

        return {
          ...prevState,
          walletAddress: wallet,
          leaderboard: newLeaderboard,
        };
      });
      return true;
    }
    return false;
  }, []);

  return {
    state,
    commandInputRef,
    validatePassword,
    processCommand,
    returnToTerminal,
    startGame,
    updateGameScore,
    endGame,
    submitWalletAddress,
  };
}
