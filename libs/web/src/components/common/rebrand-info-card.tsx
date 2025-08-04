import React, {useState} from "react";
import {Button} from "@/meshwave-ui/Button/Button";

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

export const RebrandInfoCard: React.FC<RebrandInfoCardProps> = ({
  icon,
  iconImage = "/images/mira-to-microchain.png",
  headline = "Mira is now Microchain!",
  subheadline = "Faster swaps, smoother UX, and improved price execution coming soon.",
  buttonText = "Watch trailer",
  buttonHref = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  linkText = "Maybe later",
  className = "",
}) => {
  const [hide, setHide] = useState(false);
  return (
    <div
      className={`fixed bottom-10 right-8 w-80 max-w-[calc(100vw-3rem)] md:max-w-80 bg-black rounded-xl shadow-2xl animate-[slide-in-right_0.5s_ease-in-out] overflow-hidden ${hide ? "hidden" : ""} ${className}`}
    >
      {/* Content */}
      <div className="p-8 space-y-6">
        {/* Icon Section */}
        {iconImage ? (
          <div className="w-30 h-10">
            <img
              src={iconImage}
              alt="Icon"
              className="w-full h-full object-contain"
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
            onClick={() => window.open(buttonHref, "_blank")}
          >
            {buttonText}
          </Button>

          <Button
            onClick={() => setHide(true)}
            className="text-base text-white underline hover:no-underline transition-all duration-200 font-normal"
            variant="link"
          >
            {linkText}
          </Button>
        </div>
      </div>
    </div>
  );
};
