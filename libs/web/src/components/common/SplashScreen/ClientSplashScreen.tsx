"use client";
import {useEffect, useState, useRef} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {getBrandText} from "@/src/utils/brandName";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";

const MAX_SPLASH_DURATION = 2000; // maximum time in splash page
const LAST_FRAME_DURATION = 200; // How long to pause on last frame
const FADE_DURATION = 200; // Length of time for the fade out animation
const PLAYBACK_RATE = 2; // Playback speed 1=100%

export const ClientSplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rebrandEnabled = getIsRebrandEnabled();
  const brandText = getBrandText();

  useEffect(() => {
    if (!isVisible || !videoRef.current) return;

    // Start playing the video
    videoRef.current.play().catch((error) => {
      console.error("Video failed playing", error);
    });

    // Listen for video end to pause on last frame and start fade
    const handleVideoEnd = () => {
      console.log("Video ended, pausing on last frame");
      if (videoRef.current) {
        videoRef.current.pause();
        // Start fade out after a brief pause on last frame
        setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setIsVisible(false);
          }, FADE_DURATION); // Fade out duration
        }, LAST_FRAME_DURATION); // Pause on last frame for 1 second
      }
    };

    videoRef.current.addEventListener("ended", handleVideoEnd);

    // Fallback timer in case video doesn't end properly
    const fallbackTimer = setTimeout(() => {
      if (videoRef.current && !videoRef.current.ended) {
        console.info("Fallback: video taking too long, forcing end");
        handleVideoEnd();
      }
    }, MAX_SPLASH_DURATION);

    return () => {
      videoRef.current?.removeEventListener("ended", handleVideoEnd);
      clearTimeout(fallbackTimer);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 z-50 bg-white flex items-center justify-center"
        initial={{opacity: 0}}
        animate={{opacity: isFading ? 0 : 1}}
        exit={{opacity: 0}}
        transition={{duration: 0.5}}
      >
        {videoError ? (
          <div className="text-black text-center">
            <h1 className="text-6xl lg:text-8xl mb-4">
              {brandText.name}
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600">
              {rebrandEnabled
                ? "The future of decentralized finance"
                : "Trade like a predator"}
            </p>
          </div>
        ) : (
          <motion.video
            ref={videoRef}
            className="max-w-[400px] h-auto object-contain"
            muted
            playsInline
            autoPlay
            disablePictureInPicture
            disableRemotePlayback
            onError={(e) => {
              console.error("Video error:", e);
              setVideoError(true);
            }}
            onLoadedData={() => {
              if (videoRef.current) {
                videoRef.current.playbackRate = PLAYBACK_RATE;
              }
            }}
            animate={{opacity: isFading ? 0 : 1}}
            transition={{duration: 0.5}}
          >
            <source src="/video/microchain-lq.webm" type="video/webm" />
            {/* Fallback for browsers that don't support MP4 */}
            <source src="/video/microchain.mp4" type="video/mp4" />
          </motion.video>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
