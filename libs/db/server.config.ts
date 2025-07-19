// github.com/jhb-software/payload-plugins/tree/main/geocoding
/* eslint-disable node/prefer-global/process */

import {PayloadRequest, type Payload} from "payload";
import sharp from "sharp";

import {seed} from "@/db/seed";

// import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import {resendAdapter} from "@payloadcms/email-resend";
import {postgresAdapter} from "@payloadcms/db-postgres";
// import {sqliteAdapter} from "@payloadcms/db-sqlite";
import {s3Storage} from "@payloadcms/storage-s3";

import {openapi, swaggerUI, redoc, rapidoc} from "payload-oapi";

import {twitterOAuth} from "@/db/access/auth";
import {
  // navAccordions,
  Brands,
  Media,
  Users,
  Games,
} from "@/db/collections";

import {Settings} from "@/db/globals";

export const dbConfig = {
  collections: [Users, Brands, Media, Games],
  globals: [Settings],
  blocks: [],
  plugins: [
    twitterOAuth,
    // github.com/janbuchar/payload-oapi
    openapi({
      enabled: true,
      openapiVersion: "3.0",
      metadata: {
        title: "🕹 Microgame API Reference",
        version: "1.0.0?",
        description: [
          "🧩 OpenAPI Spec for Microgame.",
          "",
          "- ✨ [Scalar UI:](/docs): `/docs`",
          "",
          "- 📗 [Swagger UI:](/api/docs/swagger) `/api/docs/swagger`",
          "",
          "- 📘 [Redoc UI:](/api/docs/redoc) `/api/docs/redoc`",
          "",
          "- 📕 [Rapidoc UI:](/api/docs/rapidoc) `/api/docs/rapidoc`",
          "",
          "- 🛝 [GraphQL Playground:](/api/graphql-playground) `/api/graphql-playground`",
          "",
          "- 🖥 [Admin Panel:](/admin) `/admin`",
        ].join("\n"),
      },
    }),
    swaggerUI({
      enabled: true,
      docsUrl: "/docs/swagger",
    }),
    redoc({
      enabled: true,
      docsUrl: "/docs/redoc",
    }),
    rapidoc({
      enabled: true,
      docsUrl: "/docs/rapidoc",
    }),
    // formBuilderPlugin({
    //   defaultToEmail: 'info@microchain.systems',
    //   fields: {
    //     text: true,
    //     textarea: true,
    //     select: true,
    //     email: true,
    //     state: true,
    //     country: true,
    //     checkbox: true,
    //     number: true,
    //     message: true,
    //     payment: false,
    //   },
    // formOverrides: {
    //   admin: {
    //     group: navAccordions.communication,
    //     livePreview: {
    //      url: `${process.env.WEBSITE_PUBLIC_URL}`,
    //     }
    //   },
    //   versions: {
    //     drafts: true
    //   },
    //   },
    //   formSubmissionOverrides:{
    //     slug: 'form-submissions',
    //     fields: ({ defaultFields }) => {
    //       return [
    //         ...defaultFields,
    //         {
    //           name: 'submittedBy',
    //           type: 'relationship',
    //           relationTo: 'users',
    //           admin: {
    //             readOnly: true
    //           }
    //         },
    //       ]
    //     },
    //     admin: {
    //       group: navAccordions.communication
    //     },
    //   }
    // }),
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
  // HACK: failing deployments on vercel due to 'Error: Cannot find module 'libsql'
  // db: process.env.SQLITE
  //   ? sqliteAdapter({
  //       client: {
  //         url: "file:../../libs/db/sqlite.db",
  //         // authToken: process.env.DATABASE_AUTH_TOKEN,
  //       },
  //       generateSchemaOutputFile: "../../libs/db/schema.ts", // resolves from location of payload.config.ts
  //     })
  // : postgresAdapter({
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
    generateSchemaOutputFile: "../../libs/db/schema.ts",
  }),
};

export const serverConfig = {
  onInit: async (payload: Payload, req: PayloadRequest) => {
    const {totalDocs} = await payload.count({
      collection: "users",
      where: {
        email: {
          equals: "test@mira.ly",
        },
      },
    });

    if (!totalDocs) {
      seed({payload, req});
    }
  },
  debug: true,
  defaultDepth: 3,
  email: resendAdapter({
    defaultFromAddress: "test@microchain.systems",
    defaultFromName: "Microchain",
    apiKey: process.env.RESEND_API_KEY || "",
  }),
  secret: process.env.PAYLOAD_SECRET,
  serverURL:
    process.env.NODE_ENV === "development"
      ? process.env.ADMIN_LOCAL_URL
      : process.env.ADMIN_PUBLIC_URL,
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
};
