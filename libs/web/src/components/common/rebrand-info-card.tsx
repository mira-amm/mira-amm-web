import React, {useState, useEffect} from "react";
import {Button} from "@/meshwave-ui/Button/Button";
import Image from "next/image";
import {useLocalStorage} from "usehooks-ts";
import {useModal} from "@/src/hooks/useModal";

interface RebrandInfoCardProps {
  icon?: string;
  iconImage?: string;
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  buttonHref?: string;
  linkText?: string;
  className?: string;
}

const REBRAND_CARD_DISMISSED_KEY = "rebrand-info-card-dismissed";

export const RebrandInfoCard: React.FC<RebrandInfoCardProps> = ({
  icon,
  iconImage = "/images/mira-to-microchain.png",
  headline = "Mira is now Microchain!",
  subheadline = "Faster swaps, smoother UX, and improved price execution coming soon.",
  buttonText = "Watch trailer",
  buttonHref = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  linkText = "No thanks",
  className = "",
}) => {
  const [isDismissed, setIsDismissed] = useLocalStorage(
    REBRAND_CARD_DISMISSED_KEY,
    false
  );
  const [Modal, openModal, closeModal] = useModal();

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleWatchVideo = () => {
    openModal();
  };

  const handleModalClose = () => {
    closeModal();
    setIsDismissed(true);
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  // Convert YouTube URL to embed URL
  const getEmbedUrl = (url: string) => {
    const videoId = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    )?.[1];
    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
      : url;
  };

  return (
    <>
      <div
        className={`fixed bottom-10 right-8 w-80 max-w-[calc(100vw-3rem)] md:max-w-80 bg-black rounded-xl shadow-2xl animate-[slide-in-right_0.5s_ease-in-out] overflow-hidden ${className}`}
      >
        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Icon Section */}
          {iconImage ? (
            <div className="relative w-32 h-10">
              <Image
                src={iconImage}
                alt="Icon"
                className="object-contain"
                fill
              />
            </div>
          ) : (
            icon && <div className="text-4xl">{icon}</div>
          )}

          {/* Headlines */}
          <div className="space-y-2">
            <h3 className="text-base font-normal text-white leading-tight">
              {headline}
            </h3>
            <p className="text-base text-content-tertiary leading-tight">
              {subheadline}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              className="bg-white text-black hover:bg-white/90 border-0 font-normal px-4 py-2 text-base"
              onClick={handleWatchVideo}
            >
              {buttonText}
            </Button>

            <Button
              onClick={handleDismiss}
              className="text-base text-white underline hover:no-underline transition-all duration-200 font-normal"
              variant="link"
            >
              {linkText}
            </Button>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <Modal
        title=""
        className="w-full h-full lg:max-w-[80vw]! lg:w-[80vw]!"
        onClose={handleModalClose}
        noBackground={true}
        showCloseIcon={false}
      >
        <div className="w-full h-full">
          <iframe
            src={getEmbedUrl(buttonHref)}
            title="Video Player"
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Modal>
    </>
  );
};
