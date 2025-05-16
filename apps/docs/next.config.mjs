import {createMDX} from "fumadocs-mdx/next";

const defaultImageHostnames = [
  "github.com",
  "img.icons8.com",
  "upload.wikimedia.org",
  "12factor.net",
  "app.swaylend.com",
];

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    remotePatterns: defaultImageHostnames.map((hostname) => ({
      protocol: "https",
      // eslint-disable-next-line node/prefer-global/process
      hostname,
    })),
  },
};

export default withMDX(config);
