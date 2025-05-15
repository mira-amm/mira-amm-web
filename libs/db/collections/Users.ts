import type { CollectionConfig, Payload } from 'payload'

import { authenticated } from '../access/index';
import { getOrUploadMedia } from "@/db/seed";

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    cookies: {
      sameSite: 'None',
      secure: process.env.NODE_ENV !== 'development',
      domain: process.env.NODE_ENV === 'development' ? 'localhost' : '.mira.ly',
      },
    // disableLocalStrategy: {
    //   enableFields: true,
    //   optionalPassword: true,
    // },
  },
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    livePreview: {
      url: process.env.NODE_ENV === "development" ? 'http://localhost:8000' : 'https://microgame.mira.ly',
      breakpoints: [
        {label: "Mobile", name: "mobile", width: 320, height: 568},
      ],
  },
    defaultColumns: [
      'avatar',
      'name',
      'xUserName',
      'email',
      'walletAddress',
    ],
    useAsTitle: 'name',
    pagination: {
      defaultLimit: 50,
      limits: [10, 20, 50],
    },
  },
  fields: [
    {
      type:"row",
    fields:[
    {
      type: "collapsible",
      label: ({ data }) => data?.title || "Personal Information",
      fields: [
        { name: "name", type: "text", label: "Name" },
        {
          name: "avatar",
          type: "upload",
          relationTo: "media",
          label: "Avatar",
        },
      ],
    },
    ]
    },
    {
      name: 'walletAddress',
      type: 'text',
    },
    {
      name: 'games',
      type: 'join',
      on: 'player',
      collection: 'games',
      defaultSort: '-score'
    },
        {
          type: "collapsible",
      admin: { position: "sidebar",
               readOnly: true
             },
          label: "X",
          fields: [
            {
              name: "xUserName",
              type: "text",
              label: "Username",
              admin: { readOnly: true },
            },
            {
              name: "xUrl",
              label: "URL",
              type: "text",
              admin: {
                readOnly: true,
              },
            },
            {
              name: "xIsIdentityVerified",
              label: "ID Verified",
              type: "checkbox",
              admin: {
                readOnly: true,
              },
            },
            {
              name: "xVerified",
              label: "Verified",
              type: "checkbox",
              admin: {
                readOnly: true,
              },
            },
          ],
        },
  ],
  timestamps: true,
}


export async function seedUsers(payload: Payload, req: any) {
  payload.logger.info("👤 Uploading user avatars & inserting users...");

  await Promise.all(
[
  {
    name: "Kate Kharitonova",
    email: "kate.kharitonova@microchain.systems",
    xUserName: "litlaroca",
    mediaUrl:
      "https://i.abcnewsfe.com/a/a63a564c-6577-4a93-89df-7af7dee5de60/dino-1-ht-er-240110_1704903903782_hpMain.jpeg",
    walletAddress: "0xA3f91eC0B5a14cBc8f9a6CdbAf7B6E1eF6A8F1B3"
  },
  {
    name: "Fossil Frank",
    xUserName: "FrankTheFossil",
    email: "fossil.frank@microchain.systems",
    mediaUrl:
      "https://avatars.githubusercontent.com/u/112352297?v=4",
    walletAddress: "0x9cC0F3a77EfAe92F2Be57d47fCb9FbB23c45e9Fd"
  },
  {
    name: "Derek Dino",
    xUserName: "MicrochainSys",
    email: "derek.dino@microchain.systems",
    mediaUrl:
      "https://avatars.githubusercontent.com/u/13684960?v=4",
    walletAddress: "0x4e8d5D93E8Efa7cB6a22f8Fa728Dcb16eB6D9D5A"
  },
  {
    name: "Amal Josea",
    email: "amal.josea@example.com",
    xUserName: "joseamal07",
    mediaUrl:
      "https://avatars.githubusercontent.com/u/26934320?v=4",
    walletAddress: "0x6bFd3Cb891aef1Df51F8d2b25D4FbAdB726fe9b7"
  },
  {
    name: "Mattias Lightstone",
    xUserName: "lig92960",
    email: "mattias.lightstone@microchain.systems",
    mediaUrl:
      "https://avatars.githubusercontent.com/u/19267314?v=4",
    walletAddress: "0xD93fEb0D9Bd8cBBc38E51F3C03CcDcFec5A49c35"
  },
  {
    name: "Mumtahin Farabi",
    email: "mumtahin.farabi@microchain.systems",
    xUserName: "charthouselabs",
    mediaUrl:
      "https://avatars.githubusercontent.com/u/54924158?v=4",
    walletAddress: "0x0b7A0EDAfCDE2c7B93f8c1b44A85c167aFE4C654"
  }
    ].map(async (user) => {
      const media = await getOrUploadMedia(
        payload,
        req,
        user.mediaUrl,
        `${user.name.replace(/ /g, "-").toLowerCase()}-avatar.png`,
        `${user.name}'s Avatar`,
      );


      await payload.create({
        collection: "users",
        data: {
          email: user.email,
          xUserName: user.xUserName,
          name: user.name,
          avatar: media?.id || null,
          walletAddress: user.walletAddress,
        },
      });

      payload.logger.info(
        `✅ Inserted user: ${user.name}`,
      );
    }),
  );
}
