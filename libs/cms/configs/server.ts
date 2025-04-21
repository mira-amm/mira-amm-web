// github.com/jhb-software/payload-plugins/tree/main/geocoding
/* eslint-disable node/prefer-global/process */

import { resendAdapter } from '@payloadcms/email-resend'
import sharp from "sharp";

export const serverConfig = {
defaultDepth: 3,
  email: resendAdapter({
    defaultFromAddress: 'test@microchain.systems',
    defaultFromName: 'Microchain',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  plugins: [
formBuilderPlugin({
  defaultToEmail: 'info@microchain.systems',
  fields: {
    text: true,
    textarea: true,
    select: true,
    email: true,
    state: true,
    country: true,
    checkbox: true,
    number: true,
    message: true,
    payment: false,
  },
formOverrides: {
  admin: {
    group: navAccordions.communication,
    livePreview: {
     url: `${process.env.WEBSITE_PUBLIC_URL}`,
    }
  },
  versions: {
    drafts: true
  },
  },
  formSubmissionOverrides:{
    slug: 'form-submissions',
    fields: ({ defaultFields }) => {
      return [
        ...defaultFields,
        {
          name: 'submittedBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            readOnly: true
          }
        },
      ]
    },
    admin: {
      group: navAccordions.communication
    },
  }
}),
    s3Storage({
    enabled: process.env.NODE_ENV !== "development",
    collections: {
      media: {
        prefix: "./media",
      },
    },
    bucket: process.env.S3_BUCKET || "",
    config: {
      forcePathStyle: true, // Important for using Supabase
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      },
      region: process.env.S3_REGION || "",
      endpoint: process.env.S3_ENDPOINT || "",
    },
  }),
],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
// db: sqliteAdapter({
//     client: {
//       url: "file:../../libs/db/sqlite.db",
//       // authToken: process.env.DATABASE_AUTH_TOKEN,
//     },
    generateSchemaOutputFile: "../../libs/db/schema.ts", // resolves from location of payload.config.ts
  }),
  secret: process.env.PAYLOAD_SECRET,
  serverURL: process.env.NODE_ENV === 'development' ? process.env.MICROGAME_LOCAL_URL : process.env.MICROGAME_PUBLIC_URL,
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
