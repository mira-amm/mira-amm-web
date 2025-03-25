import { ColorProps } from "../SvgPropTypes";

export const ArrowRightIcon = ({ primaryColor, secondaryColor }: ColorProps) => {
  return (
    <svg
      focusable="false"
      aria-hidden="true"
      viewBox="0 0 24 24"
      data-testid="NavigateNextIcon"
      fill={primaryColor}
    >
      <path fill={secondaryColor} d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
    </svg>
  );
};