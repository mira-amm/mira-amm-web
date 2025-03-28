const FailureIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={58}
      height={57}
      viewBox="0 0 58 57"
      fill="none"
    >
      <path
        fill="#F55353"
        fillRule="evenodd"
        d="M29 57c15.74 0 28.5-12.76 28.5-28.5S44.74 0 29 0 .5 12.76.5 28.5 13.26 57 29 57Zm0-5.478c-12.715 0-23.022-10.307-23.022-23.022C5.978 15.785 16.285 5.478 29 5.478c12.715 0 23.022 10.307 23.022 23.022 0 12.715-10.307 23.022-23.022 23.022Z"
        clipRule="evenodd"
      />

      <path
        d="M35.832 37L29 30.168 22.168 37M20.5 35.332l6.832-6.832-6.832-6.832M22.168 20 29 26.832 35.832 20M37.5 21.668l-6.832 6.832 6.832 6.832"
        stroke="#F55353"
        strokeWidth={2.5}
      />
    </svg>
  );
};

export default FailureIcon;
