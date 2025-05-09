const PointsIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circle background */}
      <rect width="20" height="20" rx="10" fill="white" fillOpacity="0.4" />

      {/* 45° rotated square */}
      <rect
        x="10"
        y="5.17"
        width="6.87"
        height="6.87"
        transform="rotate(45 10 5.17)"
        fill="white"
      />
    </svg>
  );
};

export default PointsIcon;
