import React, { FC, useEffect, useRef } from "react";

type GameFileName = "blind-fear";

const noop = () => {};

interface GameProps {
  onStart?: () => void;
  onOver?: () => void;
  onExit?: () => void;
  onChangScore?: (score: number) => void;
}

interface GameLauncherProps extends GameProps {
  gameFileName: GameFileName;
}

type GameState = "game" | "game-over" | "exit";

const GameLauncher: FC<GameLauncherProps> = ({
  gameFileName,
  onStart = noop,
  onOver = noop,
  onExit = noop,
  onChangScore = noop,
}) => {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = ref.current;
    const iframeBody = iframe?.contentDocument?.body;

    const onIframeLoad = () => {
      if (!iframeBody) return;

      const handleGameStateChange = (state: GameState) => {
        switch (state) {
          case "game":
            onStart();
            break;
          case "game-over":
            onOver();
            iframe.blur();
            break;
          case "exit":
            onExit();
            iframe.blur();
            break;
          default:
            iframe.blur();
            break;
        }
      };

      const handleIntersection = (entries: IntersectionObserverEntry[]) => {
        const someIntersecting = entries.some((entry) => entry.isIntersecting);
        if (someIntersecting) {
          iframe.focus();
        } else {
          iframe.blur();
        }
      };

      const iObserver = new IntersectionObserver(handleIntersection, {
        threshold: 0.7,
      });

      const mObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type !== "attributes") continue;
          const attributeName = mutation.attributeName;
          const attributeValue = (mutation.target as HTMLElement).getAttribute(attributeName!);

          if (attributeName === "data-game-state") {
            handleGameStateChange(attributeValue as GameState);
          } else if (attributeName === "data-game-score") {
            onChangScore(Number(attributeValue));
          }
        }
      });

      mObserver.observe(iframe.contentDocument.body, {
        attributes: true,
      });
      iObserver.observe(iframe.contentDocument.body);
      return () => {
        mObserver.disconnect();
        iObserver.disconnect();
      };
    };

    if (iframe) {
      iframe.addEventListener("load", onIframeLoad);
    }

    return () => {
      iframe?.removeEventListener("load", onIframeLoad);
    };
  }, [ref]);

  return (
    <iframe ref={ref} width={"100%"} height={"525px"} src={`/games/${gameFileName}/index.html`} title={gameFileName} />
  );
};

GameLauncher.displayName = "GameLauncher";

const BlindFear = (props: GameProps) => {
  return <GameLauncher gameFileName="blind-fear" {...props} />;
};

GameLauncher.displayName = "BlindFear";

const Game = (props: GameProps) => {
  return <BlindFear {...props} />;
};

export { Game };
