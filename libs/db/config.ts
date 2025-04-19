// github.com/jhb-software/payload-plugins/tree/main/geocoding
/* eslint-disable node/prefer-global/process */
import {
  navAccordions,
        Brands,
        Media,
        Users,
       } from "@/db/collections"

import {Constants} from "@/db/globals"

import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { postgresAdapter } from "@payloadcms/db-postgres";
// import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { s3Storage } from '@payloadcms/storage-s3'

export const dataBaseConfig = {
  collections: [
    Users,
    Brands,
    Media,
  ],
  globals:[
    Constants
  ],
  blocks:[
  ],
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
  })
}
