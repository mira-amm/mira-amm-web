const TerminalHeader = () => {
  return (
    <div className="terminal-header h-8 bg-terminal-bg border-b border-terminal-text/30 flex items-center px-4">
      <div className="flex space-x-2 items-center">
        <div className="h-3 w-3 rounded-full bg-terminal-red"></div>
        <div className="h-3 w-3 rounded-full bg-terminal-yellow"></div>
        <div className="h-3 w-3 rounded-full bg-terminal-green"></div>
      </div>
      <div className="text-center flex-1 text-terminal-text text-sm">T-REX TECHNOLOGIES: DLM-2000 PROTOTYPE v0.8.5b</div>
    </div>
  );
};

export default TerminalHeader;
