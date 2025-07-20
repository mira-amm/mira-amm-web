import React from "react";
import ReactDOM from "react-dom/client";
import "../../../../libs/meshwave-ui/global.css";

function App() {
  return (
    <>
      <div className="flex items-center justify-center h-full w-100 bg-gradient-to-br from-black via-terminal-red to-terminal-green p-4 space-x-2">
        <img src="/favicon.ico" alt="Microchain Logo" className="size-24" />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white font-sora">
            Microvisor
          </h1>
          <p className="text-black text-sm">
            Dissecting Fuel’s liquidity, one molecule at a time.
          </p>
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;
