import {ColorProps} from "../SvgPropTypes";

const MicrochainTextLogo = ({primaryColor = "#fff"}: ColorProps) => {
  return (
    <svg
      width="180"
      height="24"
      viewBox="0 0 180 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="0"
        y="18"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="24"
        fill={primaryColor}
        fontWeight="bold"
      >
        MICROCHAIN
      </text>
    </svg>
  );
};

export default MicrochainTextLogo;
