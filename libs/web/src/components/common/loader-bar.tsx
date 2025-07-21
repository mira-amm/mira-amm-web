import {useEffect, useState} from "react";

const LoaderBar = () => {
  const symbols = ["/", "-", "\\", "|"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % symbols.length);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-center inline-block w-4">
      {symbols[index]}
    </span>
  );
};

export default LoaderBar;
