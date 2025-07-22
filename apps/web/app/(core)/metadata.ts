import {Metadata} from "next";
import {getBrandText} from "@/web";

const brandText = getBrandText();

export const metadata: Metadata = {
  title: brandText.defaultTitle,
  description: brandText.defaultDescription,
  icons: {
    icon: brandText.favicon,
  },
  openGraph: {
    title: brandText.defaultTitle,
    url: `${brandText.baseUrl}/swap`,
    description: brandText.defaultDescription,
    images: brandText.defaultImage,
  },
  twitter: {
    title: brandText.defaultTitle,
    description: brandText.defaultDescription,
    images: brandText.defaultImage,
  },
};
