import type { CollectionConfig } from 'payload'

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
    defaultColumns: [
      'avatar',
      'firstName',
      'lastName',
      'email'
    ],
    useAsTitle: 'preferredDisplayName',
  },
  fields: [
    {
      type:"row",
    fields:[
    {
      type: "collapsible",
      label: ({ data }) => data?.title || "Personal Information",
      fields: [
        {
          type: 'row',
          fields:[
        { name: "firstName", type: "text", label: "First Name" },
        { name: "middleName", type: "text", label: "Middle Name", admin: {hidden: true} },
        { name: "lastName", type: "text", label: "Last Name" },
        { name: "preferredDisplayName", type: "text", label: "Display Name" },
          ],
        },
        {
          name: "avatar",
          type: "upload",
          relationTo: "media",
          label: "Avatar",
        }
      ],
    },
    ]
    },
    {
      name: 'walletAddress',
      type: 'text',
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
        email: "mumtahin.farabi@microchain.systems",
        firstName: "Mumtahin",
        lastName: "Farabi",
        preferredDisplayName: "Mumtahin Farabi",
        mediaUrl:
          "https://i.abcnewsfe.com/a/a63a564c-6577-4a93-89df-7af7dee5de60/dino-1-ht-er-240110_1704903903782_hpMain.jpeg",
      },
      {
        email: "kate.kharitonova@microchain.systems",
        firstName: "Kate",
        lastName: "Kharitonova",
        preferredDisplayName: "Kate Kharitonova",
        mediaUrl:
          "https://i.abcnewsfe.com/a/a63a564c-6577-4a93-89df-7af7dee5de60/dino-1-ht-er-240110_1704903903782_hpMain.jpeg",
      },
      {
        email: "fossil.frank@microchain.systems",
        firstName: "Fossil",
        lastName: "Frank",
        preferredDisplayName: "Fossil Frank",
        mediaUrl:
          "https://i.abcnewsfe.com/a/a63a564c-6577-4a93-89df-7af7dee5de60/dino-1-ht-er-240110_1704903903782_hpMain.jpeg",
      },
      {
        email: "derek.dino@microchain.systems",
        firstName: "Derek",
        lastName: "Dino",
        preferredDisplayName: "Derek Dino",
        mediaUrl:
          "https://i.abcnewsfe.com/a/a63a564c-6577-4a93-89df-7af7dee5de60/dino-1-ht-er-240110_1704903903782_hpMain.jpeg",
      },
      {
        email: "amal.josea@example.com",
        firstName: "Amal",
        lastName: "Josea",
        preferredDisplayName: "Amal Josea",
        mediaUrl:
          "https://i.abcnewsfe.com/a/a63a564c-6577-4a93-89df-7af7dee5de60/dino-1-ht-er-240110_1704903903782_hpMain.jpeg",
      },
      {
        email: "mattias.lightstone@microchain.systems",
        firstName: "Mattias",
        lastName: "Lightstone",
        preferredDisplayName: "Mattias Lightstone",
        mediaUrl:
          "https://i.abcnewsfe.com/a/a63a564c-6577-4a93-89df-7af7dee5de60/dino-1-ht-er-240110_1704903903782_hpMain.jpeg",
      },
      {
        email: "mumtahin.farabi@microchain.systems",
        firstName: "Mumtahin",
        lastName: "Farabi",
        preferredDisplayName: "Mumtahin Farabi",
        mediaUrl:
          "https://i.abcnewsfe.com/a/a63a564c-6577-4a93-89df-7af7dee5de60/dino-1-ht-er-240110_1704903903782_hpMain.jpeg",
      },
    ].map(async (user) => {
      const media = await getOrUploadMedia(
        payload,
        req,
        user.mediaUrl,
        `${user.firstName.toLowerCase()}-${user.lastName.toLowerCase()}-avatar.png`,
        `${user.firstName} ${user.lastName}'s avatar`,
      );


      await payload.create({
        collection: "users",
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          preferredDisplayName: user.preferredDisplayName,
          avatar: media?.id || null,
        },
      });

      payload.logger.info(
        `✅ Inserted user: ${user.firstName} ${user.lastName}`,
      );
    }),
  );
}
