// github.com/jhb-software/payload-plugins/tree/main/geocoding
/* eslint-disable node/prefer-global/process */

import { resendAdapter } from '@payloadcms/email-resend'
import sharp from "sharp";

export const serverConfig = {
defaultDepth: 3,
  email: resendAdapter({
    defaultFromAddress: 'test@gmail.com',
    defaultFromName: 'Mumtahin Farabi',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  secret: process.env.PAYLOAD_SECRET,
  serverURL: process.env.NODE_ENV === 'development' ? process.env.API_LOCAL_URL : process.env.API_PUBLIC_URL,
  cors: process.env.CORS_WHITELIST_ORIGINS
    ? process.env.CORS_WHITELIST_ORIGINS.split(",")
    : [],
  csrf: process.env.CSRF_WHITELIST_ORIGINS
    ? process.env.CSRF_WHITELIST_ORIGINS.split(",")
    : [],
  sharp,
  typescript: {
    outputFile: "../../libs/db/payload-types.ts",
  },
}
