import { ColorProps } from "../SvgPropTypes";

export const ArrowLeftIcon = ({ primaryColor, secondaryColor }: ColorProps) => {
  return (
    <svg
      focusable="false"
      aria-hidden="true"
      viewBox="0 0 24 24"
      data-testid="NavigateBeforeIcon"
      fill={primaryColor}
    >
      <path fill={secondaryColor} d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
    </svg>
  );
};