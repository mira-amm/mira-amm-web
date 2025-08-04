import Image from "next/image";

const LoaderV2 = () => {
  return (
    <Image
      src="/images/loader.webp"
      alt="Loading..."
      className="animate-spin"
      width={20}
      height={20}
    />
  );
};

export default LoaderV2;
