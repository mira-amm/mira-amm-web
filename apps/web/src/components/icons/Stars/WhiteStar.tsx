interface WhiteStarIconProps {
  width: number;
  height: number;
}
const WhiteStarIcon = ({width, height}: WhiteStarIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 29 28"
      fill="none"
    >
      <path
        fill="currentColor"
        strokeWidth="4"
        d="M14.13 5.199c.05-.261.423-.267.479-.007l1.451 6.722a2.435 2.435 0 0 0 2.005 1.89l6.1.958c.261.04.28.409.024.475l-6.358 1.648a2.434 2.434 0 0 0-1.758 1.79l-1.465 6.138c-.06.254-.424.248-.476-.008l-1.238-6.053A2.434 2.434 0 0 0 11.1 16.88l-6.545-1.642c-.258-.065-.24-.437.023-.477l6.294-.956a2.435 2.435 0 0 0 2.03-1.962l1.229-6.644Z"
      />
    </svg>
  );
};

export default WhiteStarIcon;
