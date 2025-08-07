import React, {useState, useEffect} from "react";
import {Button} from "@/meshwave-ui/Button/Button";
import Image from "next/image";
import {useLocalStorage} from "usehooks-ts";
import {useModal} from "@/src/hooks/useModal";
import Link from "next/link";
import {XIcon} from "lucide-react";

interface RebrandInfoCardProps {
  icon?: string;
  iconImage?: string;
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  videoLink?: string;
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
  videoLink = "https://youtu.be/X6iqdzdXqTc",
  linkText = "Learn more",
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
    const videoId = "X6iqdzdXqTc";
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
        <div className="relative p-8 space-y-6">
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

          <XIcon
            onClick={handleDismiss}
            className="text-white size-5 absolute top-8 right-8 hover:cursor-pointer"
          />

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
              <Link
                href="https://mirror.xyz/0xBE101110E07430Cf585123864a55f51e53ABc339/K5UQ9eDTdG1OP2RsVNdth5upq4anJq86W5XkwsXxR8s"
                target="_blank"
                className="text-base text-white underline hover:no-underline transition-all duration-200 font-normal"
              >
                {linkText}
              </Link>
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
            src={getEmbedUrl(videoLink)}
            title="Video Player"
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        </div>
      </Modal>
    </>
  );
};
