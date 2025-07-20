import Link from "next/link";

const iconStyle = {
  marginRight: "8px",
};

const buttonStyles = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  padding: "12px 0",
  cursor: "pointer",
  color: "white",
  fontSize: "16px",
  fontWeight: "bold",
  borderRadius: "5px",
  transition: "all 750ms ease-in-out",
};

export const OAuthButton = ({href, iconSrc, bgColor, altText}: any) => {
  return (
    <Link href={href} style={{flex: 1}}>
      <button style={{...buttonStyles, backgroundColor: bgColor}}>
        <img
          src={iconSrc}
          alt={altText}
          width="24"
          height="24"
          style={iconStyle}
        />
      </button>
    </Link>
  );
};
