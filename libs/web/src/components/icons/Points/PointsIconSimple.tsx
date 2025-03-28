interface PointsIconSimpleProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

const PointsIconSimple = ({
  width = 20,
  height = 20,
  className = "",
}: PointsIconSimpleProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 45° rotated square without the circle background */}
      <rect
        x="10"
        y="5.17"
        width="6.87"
        height="6.87"
        transform="rotate(45 10 5.17)"
        fill="currentColor" // This will use the color from CSS
      />
    </svg>
  );
};

export default PointsIconSimple;
