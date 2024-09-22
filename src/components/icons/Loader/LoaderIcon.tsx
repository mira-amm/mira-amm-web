const LoaderIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={81}
      height={81}
      fill="none"
      viewBox="0 0 81 81"
    >
      <path
        fill="url(#a)"
        d="M80.125 40.16c0 22.092-17.909 40-40 40s-40-17.908-40-40c0-22.091 17.909-40 40-40s40 17.909 40 40Zm-68.24 0c0 15.597 12.643 28.24 28.24 28.24 15.597 0 28.24-12.643 28.24-28.24 0-15.597-12.643-28.24-28.24-28.24-15.597 0-28.24 12.643-28.24 28.24Z"
      />
      <circle cx={40.125} cy={74.16} r={6} fill="var(--accent-primary)"/>
      <defs>
        <radialGradient
          id="a"
          cx={0}
          cy={0}
          r={1}
          gradientTransform="matrix(0 40 -40 0 40.125 40.16)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--accent-primary)"/>
          <stop offset={1} stopColor="#fff" stopOpacity={0}/>
        </radialGradient>
      </defs>
    </svg>
  );
};

export default LoaderIcon;
