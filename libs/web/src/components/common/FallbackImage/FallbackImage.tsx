import {useEffect, useState} from "react";
import Image from "next/image";
import defaultImage from "@/assets/unknown-asset.svg";

type FallbackImageProps = {
    onChangeParam?: any;
    src: string | undefined;
    alt: string;
    width?: number;
    height?: number; 
    priority?: boolean;
}

export const FallbackImage = ({
  onChangeParam,
  src = defaultImage,
  alt,
  width,
  height,
  priority,
}: FallbackImageProps) => {

  const [imgError, setImgError] = useState(false);

    useEffect(() => {
      if (imgError) {
        setImgError(false);
      }
    }, [onChangeParam]);

  return (
    <Image
      src={imgError ? defaultImage : src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      onError={() => setImgError(true)}
    />
  );
};
